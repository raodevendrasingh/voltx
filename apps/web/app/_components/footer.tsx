import Link from "next/link";
import { Copyright } from "lucide-react";
import type { JSX } from "react";
import { BrandLogoWordmark } from "@/components/BrandLogo";

export const Footer = (): JSX.Element => {
	return (
		<footer className="border-t border-border py-4 mt-auto bg-accent/20">
			<div className="container px-4 mx-auto">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
					<div className="flex justify-center md:justify-start">
						<BrandLogoWordmark />
					</div>

					<div className="flex items-center justify-center gap-1.5 text-muted-foreground order-3 md:order-2">
						<Copyright size={14} className="shrink-0" />
						<span className="text-sm font-medium">
							{new Date().getFullYear()} All rights reserved
						</span>
					</div>

					<div className="flex justify-center md:justify-end gap-4 order-2 md:order-3">
						<Link
							href="https://github.com/raodevendrasingh/voltx"
							target="_blank"
							rel="noopener noreferrer"
							aria-label="GitHub"
							className="text-muted-foreground hover:text-foreground transition-colors "
						>
							<svg
								role="img"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
								className="w-5 h-5 fill-current"
							>
								<title>GitHub</title>
								<path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
							</svg>
						</Link>
						<Link
							href="https://www.npmjs.com/package/voltx"
							target="_blank"
							rel="noopener noreferrer"
							aria-label="NPM"
							className="text-muted-foreground hover:text-foreground transition-colors"
						>
							<svg
								role="img"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
								className="w-5 h-5 fill-current"
							>
								<title>npm</title>
								<path d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z" />
							</svg>
						</Link>

						<Link
							href="https://www.x.com/tminusdev"
							target="_blank"
							rel="noopener noreferrer"
							aria-label="NPM"
							className="text-muted-foreground hover:text-foreground transition-colors"
						>
							<svg
								role="img"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
								className="w-5 h-5 fill-current"
							>
								<title>X</title>
								<path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
							</svg>
						</Link>

						<Link
							href="https://peerlist.io/devendrasingh"
							target="_blank"
							rel="noopener noreferrer"
							aria-label="NPM"
							className="text-muted-foreground hover:text-foreground transition-colors"
						>
							<svg
								role="img"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
								className="w-5 h-5 fill-current"
							>
								<title>Peerlist</title>
								<path d="M12 0C2.667 0 0 2.667 0 12s2.673 12 12 12 12-2.667 12-12S21.327 0 12 0zm8.892 20.894c-1.57 1.569-4.247 2.249-8.892 2.249s-7.322-.68-8.892-2.25C1.735 19.522 1.041 17.3.89 13.654A39.74 39.74 0 0 1 .857 12c0-1.162.043-2.201.13-3.13.177-1.859.537-3.278 1.106-4.366.284-.544.62-1.006 1.013-1.398s.854-.729 1.398-1.013C5.592 1.524 7.01 1.164 8.87.988 9.799.9 10.838.858 12 .858c4.645 0 7.322.68 8.892 2.248 1.569 1.569 2.25 4.246 2.25 8.894s-.681 7.325-2.25 8.894zM20.538 3.46C19.064 1.986 16.51 1.357 12 1.357c-4.513 0-7.067.629-8.54 2.103C1.986 4.933 1.357 7.487 1.357 12c0 4.511.63 7.065 2.105 8.54C4.936 22.014 7.49 22.643 12 22.643s7.064-.629 8.538-2.103c1.475-1.475 2.105-4.029 2.105-8.54s-.63-7.065-2.105-8.54zM14.25 16.49a6.097 6.097 0 0 1-2.442.59v2.706H10.45v.357H6.429V5.57h.357V4.214h5.676c3.565 0 6.467 2.81 6.467 6.262 0 2.852-1.981 5.26-4.68 6.013zm-1.788-8.728H10.45v5.428h2.011c1.532 0 2.802-1.2 2.802-2.714s-1.27-2.714-2.802-2.714zm.901 4.351c.117-.239.186-.502.186-.78 0-1.01-.855-1.857-1.945-1.857h-.296V8.62h1.154c1.09 0 1.945.847 1.945 1.857 0 .705-.422 1.323-1.044 1.637zm4.104 1.493c.043-.063.083-.129.123-.194a5.653 5.653 0 0 0 .526-1.103 5.56 5.56 0 0 0 .11-.362c.02-.076.042-.15.06-.227a5.58 5.58 0 0 0 .073-.41c.01-.068.025-.134.032-.203.024-.207.038-.417.038-.63 0-3.198-2.687-5.763-5.967-5.763H7.286v14.572h4.022v-3.048h1.154c1.43 0 2.747-.488 3.778-1.303a5.92 5.92 0 0 0 .46-.406c.035-.034.066-.07.1-.105.107-.11.21-.22.308-.337.044-.053.084-.108.126-.162.081-.104.16-.21.233-.319zm-5.005 1.775H10.45v3.048H8.143V5.57h4.319c2.837 0 5.11 2.211 5.11 4.905s-2.273 4.905-5.11 4.905z" />
							</svg>
						</Link>
					</div>
				</div>
			</div>
		</footer>
	);
};
