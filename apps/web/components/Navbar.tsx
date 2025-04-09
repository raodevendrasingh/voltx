import Link from "next/link";
import { BrandLogoWordmark } from "./BrandLogo";

export function Navbar() {
	return (
		<nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container flex h-14 items-center">
				<BrandLogoWordmark />
				<div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
					<nav className="flex items-center space-x-6">
						<Link
							href="/docs"
							className="text-sm font-medium transition-colors hover:text-foreground/80"
						>
							Documentation
						</Link>
						<Link
							href="/about"
							className="text-sm font-medium transition-colors hover:text-foreground/80"
						>
							About
						</Link>
						{/* Add more navigation items as needed */}
					</nav>
				</div>
			</div>
		</nav>
	);
}
