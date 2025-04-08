import { Footer } from "../_components/footer";
import { Hero } from "./_components/hero";

export default function HomePage() {
	return (
		<main className="flex flex-1 flex-col justify-center text-center">
			<Hero />
			<Footer />
		</main>
	);
}
