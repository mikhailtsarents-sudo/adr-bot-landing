"use client";

import { useLang } from "@/lib/i18n/use-lang";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

const screens = [
  {
    src: "/bot-screen-2.png",
    alt: "ADR Bot — Frage zur Gefahrentafel 33/1203 (UN-Nummer)",
  },
  {
    src: "/bot-screen-1.png",
    alt: "ADR Bot — Frage zur Gefahrgutklasse 4, Klasse 4.1",
  },
  {
    src: "/bot-screen-3.png",
    alt: "ADR Bot — Frage zur Gefahrgutklasse 5.1, Oxidierende Stoffe",
  },
  {
    src: "/bot-screen-4.png",
    alt: "ADR Bot — Frage zur Gefahrgutklasse 1, Explosive Stoffe",
  },
];

export function PhoneCarousel() {
  const { t } = useLang();
  const caption = t.carousel.caption;
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const id = setInterval(() => {
      setDirection(1);
      setActive((prev) => (prev + 1) % screens.length);
    }, 3800);
    return () => clearInterval(id);
  }, []);

  function goTo(index: number) {
    setDirection(index > active ? 1 : -1);
    setActive(index);
  }

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "60%" : "-60%",
      opacity: 0,
      scale: 0.96,
    }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (dir: number) => ({
      x: dir > 0 ? "-60%" : "60%",
      opacity: 0,
      scale: 0.96,
    }),
  };

  return (
    <div className="relative mx-auto flex flex-col items-center gap-5 w-full max-w-[320px] sm:max-w-[300px] lg:max-w-[280px]">
      {/* Ambient glow */}
      <div className="absolute inset-x-4 top-6 h-48 rounded-full bg-amber-300/20 blur-3xl" />

      {/* Phone shell — width adapts via parent max-w */}
      <motion.div
        animate={{ y: [-6, 6, -6] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 w-full overflow-hidden rounded-[2.5rem] border-[5px] border-slate-800 bg-slate-800 shadow-[0_32px_80px_rgba(0,0,0,0.25),0_0_0_1px_rgba(0,0,0,0.06)]"
      >
        {/* Notch */}
        <div className="flex justify-center bg-slate-800 pb-1 pt-2.5">
          <div className="h-4 w-20 rounded-full bg-black" />
        </div>

        {/* Screen — aspect ratio 9:19.5 like iPhone */}
        <div className="relative w-full overflow-hidden bg-white" style={{ paddingBottom: "216%" }}>
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={active}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
              className="absolute inset-0"
            >
              <Image
                src={screens[active].src}
                alt={screens[active].alt}
                fill
                className="object-cover object-top"
                sizes="(max-width: 640px) 320px, (max-width: 1024px) 300px, 280px"
                priority={active === 0}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Home indicator */}
        <div className="flex justify-center bg-slate-800 py-2.5">
          <div className="h-1 w-20 rounded-full bg-white/20" />
        </div>
      </motion.div>

      {/* Dot navigation */}
      <div className="flex items-center gap-2">
        {screens.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Show screenshot ${i + 1}`}
            className={[
              "rounded-full transition-all duration-300",
              i === active
                ? "h-2 w-6 bg-amber-500"
                : "h-2 w-2 bg-slate-300 hover:bg-slate-400",
            ].join(" ")}
          />
        ))}
      </div>

      {/* Caption */}
      <p className="text-center text-xs text-slate-400">{caption}</p>
    </div>
  );
}
