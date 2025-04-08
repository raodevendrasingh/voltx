import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Copy, Terminal } from "lucide-react";
import { JSX } from "react";
import heroPlaceholder from "@/assets/placeholder/placeholder_1920x1080.png";
import Link from "next/link";

export const Hero = (): JSX.Element => {
	return (
		<section className="relative min-h-[calc(100vh-4rem)] w-full overflow-hidden">
			{/* Background Grid */}
			<div className="absolute inset-0">
				<div
					className="h-full w-full 
          bg-[linear-gradient(to_right,#4f4f4f2b_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2b_1px,transparent_1px)] 
          bg-[size:64px_64px] 
          [mask-image:radial-gradient(ellipse_80%_50%_at_50%_-20%,#000_70%,transparent_110%)]"
				/>
			</div>

			{/* Main Content */}
			<div className="container relative z-10">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-12 md:py-20">
					{/* Left Column - Content */}
					<div className="flex flex-col justify-center space-y-8 text-center md:text-left">
						{/* Hero Text */}
						<div className="space-y-4">
							<h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
								Superpower your{" "}
								<span className="text-primary">terminal</span>
							</h1>
							<p className="text-lg text-muted-foreground">
								Harness the power of AI directly in your
								terminal. Write code, analyze data, and automate
								tasks with natural language.
							</p>
						</div>

						{/* CTA Section */}
						<div className="flex flex-col space-y-6 ">
							<div className="flex flex-col sm:flex-row justify-center md:justify-start gap-4">
								<Button size="lg" className="group">
									npm i voltx
									<Copy className="w-4 h-4 ml-2 text-accent/70 group-hover:text-accent" />
								</Button>
								<Link href="/docs" className="sm:w-auto w-full">
									<Button
										size="lg"
										variant="outline"
										className="w-full sm:w-auto"
									>
										<Terminal className="w-4 h-4 mr-2" />
										View Documentation
									</Button>
								</Link>
							</div>

							{/* Social Proof */}
							<div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-muted-foreground justify-center md:justify-start">
								<div className="flex -space-x-2">
									{[...Array(4)].map((_, i) => (
										<div
											key={i}
											className="w-8 h-8 rounded-full border-2 border-background bg-muted"
										/>
									))}
								</div>
								<p className="font-medium">
									Join 1000+ developers using volt<em>x</em>
								</p>
							</div>
						</div>
					</div>

					{/* Right Column - Terminal Preview */}
					<div className="relative aspect-video">
						<div className="rounded-lg overflow-hidden border border-border bg-card shadow-2xl">
							<div className="bg-muted p-2 flex items-center gap-2">
								<div className="flex gap-1.5">
									<div className="w-3 h-3 rounded-full bg-destructive" />
									<div className="w-3 h-3 rounded-full bg-yellow-500" />
									<div className="w-3 h-3 rounded-full bg-green-500" />
								</div>
							</div>
							<div className="p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/50">
								<Image
									src={heroPlaceholder}
									alt="Terminal Preview"
									width={1920}
									height={1080}
									className="rounded-md"
									priority
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};
