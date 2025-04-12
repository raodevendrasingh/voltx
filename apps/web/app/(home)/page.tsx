import { Footer } from "@/app/_components/footer";
import { Hero } from "@/app/(home)/_components/hero";

export default function HomePage() {
	return (
		<main className="flex flex-1 flex-col justify-center text-center">
			<Hero />
			<Footer />
		</main>
	);
}
