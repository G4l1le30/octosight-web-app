import Hero from "@/components/home/Hero";
import Stats from "@/components/home/Stats";
import Features from "@/components/home/Features";

export default function Home() {
  return (
    <div className="flex flex-col">
      <Hero />
      <Stats />
      <Features />
    </div>
  );
}
