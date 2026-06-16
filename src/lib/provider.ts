import { anthropic } from "@ai-sdk/anthropic";
import {
  LanguageModelV1,
  LanguageModelV1StreamPart,
  LanguageModelV1Message,
} from "@ai-sdk/provider";

const MODEL = "claude-haiku-4-5";

export class MockLanguageModel implements LanguageModelV1 {
  readonly specificationVersion = "v1" as const;
  readonly provider = "mock";
  readonly modelId: string;
  readonly defaultObjectGenerationMode = "tool" as const;

  constructor(modelId: string) {
    this.modelId = modelId;
  }

  private async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private extractUserPrompt(messages: LanguageModelV1Message[]): string {
    // Find the last user message
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.role === "user") {
        const content = message.content;
        if (Array.isArray(content)) {
          // Extract text from content parts
          const textParts = content
            .filter((part: any) => part.type === "text")
            .map((part: any) => part.text);
          return textParts.join(" ");
        } else if (typeof content === "string") {
          return content;
        }
      }
    }
    return "";
  }

  private getLastToolResult(messages: LanguageModelV1Message[]): any {
    // Find the last tool message
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "tool") {
        const content = messages[i].content;
        if (Array.isArray(content) && content.length > 0) {
          return content[0];
        }
      }
    }
    return null;
  }

  private async *generateMockStream(
    messages: LanguageModelV1Message[],
    userPrompt: string
  ): AsyncGenerator<LanguageModelV1StreamPart> {
    // Count tool messages to determine which step we're on
    const toolMessageCount = messages.filter((m) => m.role === "tool").length;

    // Determine component type from the original user prompt
    const promptLower = userPrompt.toLowerCase();
    let componentType = "counter";
    let componentName = "Counter";

    if (promptLower.includes("form")) {
      componentType = "form";
      componentName = "ContactForm";
    } else if (promptLower.includes("card")) {
      componentType = "card";
      componentName = "Card";
    }

    // Step 1: Create component file
    if (toolMessageCount === 1) {
      const text = `I'll create a ${componentName} component for you.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(25);
      }

      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_1`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "create",
          path: `/components/${componentName}.jsx`,
          file_text: this.getComponentCode(componentType),
        }),
      };

      yield {
        type: "finish",
        finishReason: "tool-calls",
        usage: {
          promptTokens: 50,
          completionTokens: 30,
        },
      };
      return;
    }

    // Step 2: Enhance component
    if (toolMessageCount === 2) {
      const text = `Now let me enhance the component with better styling.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(25);
      }

      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_2`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "str_replace",
          path: `/components/${componentName}.jsx`,
          old_str: this.getOldStringForReplace(componentType),
          new_str: this.getNewStringForReplace(componentType),
        }),
      };

      yield {
        type: "finish",
        finishReason: "tool-calls",
        usage: {
          promptTokens: 50,
          completionTokens: 30,
        },
      };
      return;
    }

    // Step 3: Create App.jsx
    if (toolMessageCount === 0) {
      const text = `This is a static response. You can place an Anthropic API key in the .env file to use the Anthropic API for component generation. Let me create an App.jsx file to display the component.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(15);
      }

      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_3`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "create",
          path: "/App.jsx",
          file_text: this.getAppCode(componentName),
        }),
      };

      yield {
        type: "finish",
        finishReason: "tool-calls",
        usage: {
          promptTokens: 50,
          completionTokens: 30,
        },
      };
      return;
    }

    // Step 4: Final summary (no tool call)
    if (toolMessageCount >= 3) {
      const text = `Perfect! I've created:

1. **${componentName}.jsx** - A fully-featured ${componentType} component
2. **App.jsx** - The main app file that displays the component

The component is now ready to use. You can see the preview on the right side of the screen.`;

      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(30);
      }

      yield {
        type: "finish",
        finishReason: "stop",
        usage: {
          promptTokens: 50,
          completionTokens: 50,
        },
      };
      return;
    }
  }

  private getComponentCode(componentType: string): string {
    switch (componentType) {
      case "form":
        return `import React, { useState } from 'react';

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [focused, setFocused] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert('Message sent! We\\'ll be in touch.');
  };

  const fields = [
    { id: 'name', label: 'Your name', type: 'text', placeholder: 'Jane Doe' },
    { id: 'email', label: 'Email address', type: 'email', placeholder: 'jane@company.com' },
  ];

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <p className="text-sm font-medium text-violet-400 tracking-widest uppercase mb-2">Get in touch</p>
        <h2 className="text-3xl font-bold tracking-tight text-zinc-100">Send us a message</h2>
        <p className="mt-2 text-zinc-400 text-sm">We usually respond within a few hours.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        {fields.map((field) => (
          <div key={field.id}>
            <label htmlFor={field.id} className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
              {field.label}
            </label>
            <input
              type={field.type}
              id={field.id}
              name={field.id}
              value={formData[field.id]}
              onChange={handleChange}
              onFocus={() => setFocused(field.id)}
              onBlur={() => setFocused(null)}
              placeholder={field.placeholder}
              required
              className={\`w-full px-4 py-3 bg-zinc-800/50 border rounded-xl text-zinc-100 placeholder-zinc-600 transition-all duration-200 outline-none \${
                focused === field.id
                  ? 'border-violet-500 ring-1 ring-violet-500/20'
                  : 'border-zinc-700/50 hover:border-zinc-600'
              }\`}
            />
          </div>
        ))}
        <div>
          <label htmlFor="message" className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            onFocus={() => setFocused('message')}
            onBlur={() => setFocused(null)}
            placeholder="Tell us what you're working on..."
            required
            rows={4}
            className={\`w-full px-4 py-3 bg-zinc-800/50 border rounded-xl text-zinc-100 placeholder-zinc-600 transition-all duration-200 outline-none resize-none \${
              focused === 'message'
                ? 'border-violet-500 ring-1 ring-violet-500/20'
                : 'border-zinc-700/50 hover:border-zinc-600'
            }\`}
          />
        </div>
        <button
          type="submit"
          className="w-full bg-violet-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-violet-500 active:scale-[0.98] transition-all duration-150 shadow-lg shadow-violet-600/20"
        >
          Send message
        </button>
        <p className="text-center text-xs text-zinc-600">No spam. Unsubscribe anytime.</p>
      </form>
    </div>
  );
};

export default ContactForm;`;

      case "card":
        return `import React from 'react';

const Card = () => {
  const features = [
    { name: 'Analytics', desc: 'Real-time insights', icon: '◆' },
    { name: 'Automations', desc: 'Set it and forget it', icon: '⚡' },
    { name: 'Integrations', desc: '200+ connections', icon: '⬡' },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border border-zinc-800 p-8 max-w-sm">
      <div className="absolute top-0 right-0 w-40 h-40 bg-violet-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="relative">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6">
          <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
          <span className="text-xs font-medium text-violet-300">New release</span>
        </div>
        <h3 className="text-2xl font-bold text-zinc-100 tracking-tight mb-2">Pro Workspace</h3>
        <p className="text-zinc-400 text-sm leading-relaxed mb-6">
          Everything you need to ship faster. Built for teams that care about craft.
        </p>
        <div className="space-y-3 mb-8">
          {features.map((f) => (
            <div key={f.name} className="flex items-center gap-3 group">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800 text-violet-400 text-xs border border-zinc-700/50 group-hover:border-violet-500/30 transition-colors">
                {f.icon}
              </span>
              <div>
                <p className="text-sm font-medium text-zinc-200">{f.name}</p>
                <p className="text-xs text-zinc-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <button className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-all duration-150 active:scale-[0.98] shadow-lg shadow-violet-600/20">
          Get started — it's free
        </button>
      </div>
    </div>
  );
};

export default Card;`;

      default:
        return `import { useState } from 'react';

const Counter = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-col items-center gap-10 p-10">
      <div className="text-center">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">Counter</p>
        <div className="relative">
          <span className="text-8xl font-extralight tracking-tighter text-zinc-100 tabular-nums">
            {count.toString().padStart(2, '0')}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setCount(c => c - 1)}
          className="w-12 h-12 flex items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700/50 text-zinc-300 text-lg hover:bg-zinc-700 hover:border-zinc-600 active:scale-95 transition-all duration-150"
        >
          −
        </button>
        <button
          onClick={() => setCount(0)}
          className="px-5 h-12 flex items-center justify-center rounded-xl bg-zinc-800/50 border border-zinc-700/30 text-zinc-500 text-xs uppercase tracking-wider hover:text-zinc-300 hover:border-zinc-600 active:scale-95 transition-all duration-150"
        >
          Reset
        </button>
        <button
          onClick={() => setCount(c => c + 1)}
          className="w-12 h-12 flex items-center justify-center rounded-xl bg-violet-600 text-white text-lg hover:bg-violet-500 active:scale-95 transition-all duration-150 shadow-lg shadow-violet-600/25"
        >
          +
        </button>
      </div>
    </div>
  );
};

export default Counter;`;
    }
  }

  private getOldStringForReplace(componentType: string): string {
    switch (componentType) {
      case "form":
        return "No spam. Unsubscribe anytime.";
      case "card":
        return "Get started — it's free";
      default:
        return "tracking-tighter text-zinc-100";
    }
  }

  private getNewStringForReplace(componentType: string): string {
    switch (componentType) {
      case "form":
        return "Your data is encrypted end-to-end.";
      case "card":
        return "Start building today";
      default:
        return "tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-zinc-100 to-zinc-400";
    }
  }

  private getAppCode(componentName: string): string {
    return `import ${componentName} from '@/components/${componentName}';

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-8">
      <${componentName} />
    </div>
  );
}`;
  }

  async doGenerate(
    options: Parameters<LanguageModelV1["doGenerate"]>[0]
  ): Promise<Awaited<ReturnType<LanguageModelV1["doGenerate"]>>> {
    const userPrompt = this.extractUserPrompt(options.prompt);

    // Collect all stream parts
    const parts: LanguageModelV1StreamPart[] = [];
    for await (const part of this.generateMockStream(
      options.prompt,
      userPrompt
    )) {
      parts.push(part);
    }

    // Build response from parts
    const textParts = parts
      .filter((p) => p.type === "text-delta")
      .map((p) => (p as any).textDelta)
      .join("");

    const toolCalls = parts
      .filter((p) => p.type === "tool-call")
      .map((p) => ({
        toolCallType: "function" as const,
        toolCallId: (p as any).toolCallId,
        toolName: (p as any).toolName,
        args: (p as any).args,
      }));

    // Get finish reason from finish part
    const finishPart = parts.find((p) => p.type === "finish") as any;
    const finishReason = finishPart?.finishReason || "stop";

    return {
      text: textParts,
      toolCalls,
      finishReason: finishReason as any,
      usage: {
        promptTokens: 100,
        completionTokens: 200,
      },
      warnings: [],
      rawCall: {
        rawPrompt: options.prompt,
        rawSettings: {
          maxTokens: options.maxTokens,
          temperature: options.temperature,
        },
      },
    };
  }

  async doStream(
    options: Parameters<LanguageModelV1["doStream"]>[0]
  ): Promise<Awaited<ReturnType<LanguageModelV1["doStream"]>>> {
    const userPrompt = this.extractUserPrompt(options.prompt);
    const self = this;

    const stream = new ReadableStream<LanguageModelV1StreamPart>({
      async start(controller) {
        try {
          const generator = self.generateMockStream(options.prompt, userPrompt);
          for await (const chunk of generator) {
            controller.enqueue(chunk);
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return {
      stream,
      warnings: [],
      rawCall: {
        rawPrompt: options.prompt,
        rawSettings: {},
      },
      rawResponse: { headers: {} },
    };
  }
}

export function getLanguageModel() {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

  if (!apiKey || apiKey === "your-api-key-here") {
    console.log(
      "ANTHROPIC_API_KEY is not set (or is still the placeholder). " +
        "Using the mock provider — responses will be canned. " +
        "Set a real key in .env to generate components with Claude."
    );
    return new MockLanguageModel("mock-" + MODEL);
  }

  return anthropic(MODEL);
}
