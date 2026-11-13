import companyLogo from "./assets/logisticsLogo.svg";
import { motion } from "motion/react";

export default function Loader({ name }: { name?: string }) {
  return (
    <main className="h-screen bg-[#D7EDFF] p-10">
      <section className="relative flex h-full w-full flex-col items-center justify-center gap-8 overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B4FA8] via-[#0088FF] to-[#27C2FF]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.18),transparent_60%)]" />

        <motion.div
          className="relative z-10 flex flex-col items-center gap-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <img src={companyLogo} alt="Shreeln Logistics" className="w-64" />

          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-3xl font-semibold text-white">
              {name ? `Welcome back, ${name}` : "Welcome back"}
            </h1>
            <p className="text-base font-medium text-white/70">
              Getting your dashboard ready
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <span className="size-2 animate-bounce rounded-full bg-white [animation-delay:-0.3s]" />
            <span className="size-2 animate-bounce rounded-full bg-white [animation-delay:-0.15s]" />
            <span className="size-2 animate-bounce rounded-full bg-white" />
          </div>
        </motion.div>
      </section>
    </main>
  );
}
