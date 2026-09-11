// Role briefs are written lazily: the first time a recruiter confirms a role, not in bulk.
// Only a handful of the roles on file ever get a visitor, so this is where the tokens are worth spending.
import type Anthropic from '@anthropic-ai/sdk';
import { captureEvent } from './notify';
import { getBrief, getDocs, setBrief } from './store';

const BRIEF_MODEL = 'claude-opus-5';

const BRIEF_SYSTEM =
  "You write compact role briefs for Pavan Raheja's AI clone, which talks to recruiters on his website. " +
  'needs: what this role requires — from the job description when present, otherwise inferred from what the CV and ' +
  "cover letter were written to address. angle: the 2–3 experiences or results from Pavan's application that best match " +
  'those needs, with the key numbers. Use only facts stated in the documents. Leave out compensation, visa, notice ' +
  'period, location or relocation, contact details, application status, and any "honest gaps" section.';

export async function roleBrief(
  client: Anthropic,
  id: string,
  distinctId: string,
): Promise<{ brief: string | null; source: 'cached' | 'generated' | 'none' }> {
  const cached = await getBrief(id);
  if (cached) return { brief: cached, source: 'cached' };

  const docs = await getDocs(id);
  if (!docs || !(docs.jd || docs.cv || docs.cover)) return { brief: null, source: 'none' };

  const sections = [
    docs.jd && `JOB DESCRIPTION (saved by Pavan):\n${docs.jd}`,
    docs.cv && `TAILORED CV PAVAN SENT:\n${docs.cv}`,
    docs.cover && `COVER LETTER PAVAN SENT:\n${docs.cover}`,
  ].filter(Boolean);

  const response = await client.messages.create({
    model: BRIEF_MODEL,
    max_tokens: 1500,
    output_config: {
      effort: 'low',
      format: {
        type: 'json_schema',
        schema: {
          type: 'object',
          properties: {
            needs: { type: 'string', description: 'What the role needs, at most 200 characters' },
            angle: { type: 'string', description: "The 2–3 experiences Pavan's application matched to those needs, at most 240 characters" },
          },
          required: ['needs', 'angle'],
          additionalProperties: false,
        },
      },
    },
    system: BRIEF_SYSTEM,
    messages: [{ role: 'user', content: `COMPANY: ${docs.company}\nROLE: ${docs.title}\n\n${sections.join('\n\n')}` }],
  });

  await captureEvent('clone_brief_generated', distinctId, {
    role_id_hash: id.length,
    stop_reason: response.stop_reason,
    tokens_input: response.usage.input_tokens,
    tokens_output: response.usage.output_tokens,
  });
  if (response.stop_reason === 'refusal') return { brief: null, source: 'none' };

  const block = response.content.find((b) => b.type === 'text');
  try {
    const parsed = JSON.parse(block && block.type === 'text' ? block.text : '{}');
    if (!parsed.needs || !parsed.angle) return { brief: null, source: 'none' };
    const brief = `Needs: ${String(parsed.needs).trim()} Angle: ${String(parsed.angle).trim()}`;
    await setBrief(id, brief);
    return { brief, source: 'generated' };
  } catch {
    return { brief: null, source: 'none' };
  }
}
