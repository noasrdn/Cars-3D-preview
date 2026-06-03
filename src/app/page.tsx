import CanvasContainer from "@/components/CanvasContainer";
import LoadingScreen from "@/components/LoadingScreen";
import { headers } from "next/headers";
import Image from "next/image";

export default async function Home() {
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "";
  
  // Basic mobile detection via User-Agent
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());

  if (isMobile) {
    return (
      <main className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#18181a] text-white">
        <div className="flex flex-col items-center justify-center gap-12 w-full max-w-[600px] px-6 text-center">
            <div className="relative w-[200px] aspect-[2/1] my-4 opacity-30">
                <Image 
                    src="/images/loading_GT3.svg" 
                    alt="Desktop Only" 
                    fill 
                    sizes="200px"
                    className="object-contain" 
                    priority 
                />
            </div>
            <div 
                className="text-3xl font-black text-white/40 tracking-[0.1em]"
                style={{ fontFamily: "var(--font-outfit), sans-serif" }}
            >
                DESKTOP ONLY
            </div>
            <p className="text-red-500 text-center text-sm md:text-base animate-pulse uppercase tracking-widest">
                This 3D experience requires a computer.
            </p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <LoadingScreen />
      <CanvasContainer />
    </main>
  );
}