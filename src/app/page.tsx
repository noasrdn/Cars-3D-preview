import CanvasContainer from "@/components/CanvasContainer";
import LoadingScreen from "@/components/LoadingScreen";

export default function Home() {
  return (
    <main>
      <LoadingScreen />
      <CanvasContainer />
    </main>
  );
}