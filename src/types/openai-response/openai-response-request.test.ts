import type { OpenaiResponseRequest } from './response-request';

// Test Responses API request type
//@ts-ignore
const openaiResponseRequest: OpenaiResponseRequest = {
  model: 'gpt-5.3-codex',
  instructions: 'You are xxx',
  input: [
    {
      type: 'message',
      role: 'developer',
      content: [
        {
          type: 'input_text',
          text: 'Filesystem sandboxing instructions',
        },
      ],
    },
    {
      type: 'reasoning',
      summary: [{ type: 'summary_text', text: '**Planning next command**' }],
      content: null,
      encrypted_content: 'gAAAAABp',
    },
    {
      type: 'function_call',
      name: 'exec_command',
      arguments: '{"cmd":"rg --files"}',
      call_id: 'call_123',
    },
    {
      type: 'function_call_output',
      call_id: 'call_123',
      output: 'Chunk ID: 001',
    },
    {
      type: 'custom_tool_call',
      call_id: 'call_456',
      name: 'apply_patch',
      status: 'completed',
      input: '*** Begin Patch',
    },
    {
      type: 'custom_tool_call_output',
      call_id: 'call_456',
      output: 'Success',
    },
  ],
  tools: [
    {
      type: 'function',
      name: 'exec_command',
      strict: false,
      description: 'Runs shell command',
      parameters: {
        type: 'object',
        properties: {
          cmd: { type: 'string' },
        },
      },
    },
    {
      type: 'code_interpreter',
      container: { type: 'auto' },
    },
  ],
  tool_choice: 'auto',
  parallel_tool_calls: true,
  reasoning: {
    effort: 'high',
    summary: 'auto',
  },
  text: {
    verbosity: 'low',
  },
  stream: true,
  include: ['reasoning.encrypted_content'],
  prompt_cache_key: '019c9a4e-a21e-70b1-95bc-85c7236560d9',
};
