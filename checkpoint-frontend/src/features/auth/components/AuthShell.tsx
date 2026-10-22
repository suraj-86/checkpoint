import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { BackgroundScene } from "../../../components/BackgroundScene";
import { Footer } from "../../../components/Footer";
import { Mascot, type MascotMood } from "../../../components/mascot/Mascot";

export function AuthShell({
  subtitle,
  mood = "happy",
  children,
}: {
  subtitle: string;
  mood?: MascotMood;
  children: ReactNode;
}) {
  return (
    <div className="app-bg relative flex min-h-screen flex-col">
      <BackgroundScene />
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-8">
        <div className="grid w-full max-w-3xl items-center gap-6 md:grid-cols-2">
          <div className="w-full">
            <div className="mb-5 flex items-center gap-2.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-[0_3px_0_rgb(var(--cb))]">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-slate-800">Checkpoint</h1>
                <p className="text-sm font-semibold text-slate-500">{subtitle}</p>
              </div>
            </div>
            {children}
          </div>
          <div className="card hidden flex-col items-center p-8 text-center md:flex">
            <Mascot mood={mood} size={150} />
            <h2 className="mt-3 text-xl font-bold text-slate-800">Practice a little, every day.</h2>
            <p className="mt-1 text-sm text-slate-500">Short sessions, a growing mastery map and a streak to look after.</p>
          </div>
        </div>
      </div>
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
