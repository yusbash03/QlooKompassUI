import { useMeta } from '@/shared/api/useMeta';
import { Banner } from '@/shared/ui/Banner';

/** App-wide striped strip when the backend runs Qloo or the LLM in mock mode. Plans carry their own isMock banner (FE-5). */
export function MockModeBanner() {
  const meta = useMeta();
  if (!meta.data?.isMockMode) return null;
  return (
    <Banner tone="mock" strip>
      MOCK DATA — not real Qloo intelligence
      <span className="ml-2 font-sans font-normal tracking-normal text-[#FDE68A]">
        (Qloo: {meta.data.qlooMode} · AI: {meta.data.llmProvider})
      </span>
    </Banner>
  );
}
