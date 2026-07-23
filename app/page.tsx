import SmoothScroll from "@/components/SmoothScroll";
import Preloader from "@/components/Preloader";
import Header from "@/components/ui/Header";
import ReserveDock from "@/components/ui/ReserveDock";
import HeroFilm from "@/components/chapters/HeroFilm";
import Legacy from "@/components/chapters/Legacy";
import Craft from "@/components/chapters/Craft";
import ServiceTree from "@/components/ServiceTree";
import Proof from "@/components/chapters/Proof";
import Places from "@/components/chapters/Places";
import People from "@/components/chapters/People";
import SmileDesign from "@/components/chapters/SmileDesign";
import Counters from "@/components/chapters/Counters";
import Finale from "@/components/chapters/Finale";

export default function Home() {
  return (
    <SmoothScroll>
      <Preloader />
      <Header />
      <main>
        <HeroFilm />
        <Legacy />
        <Craft />
        {/* The Living Index — standalone interactive treatment tree */}
        <section id="index" className="chapter">
          <ServiceTree />
        </section>
        <Proof />
        <Places />
        <People />
        <SmileDesign />
        <Counters />
        <Finale />
      </main>
      <ReserveDock />
    </SmoothScroll>
  );
}
