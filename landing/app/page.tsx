import { Navbar } from "./_landing/Navbar";
import { Hero } from "./_landing/Hero";
import { HowItWorks } from "./_landing/HowItWorks";
import { Audiences } from "./_landing/Audiences";
import { Comparison } from "./_landing/Comparison";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Audiences />
        <Comparison />
      </main>
    </>
  );
}
