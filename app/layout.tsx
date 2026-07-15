import type { Metadata, Viewport } from "next";
import { Manrope, Cormorant_Garamond } from "next/font/google";
import { brand, clinics } from "@/lib/content";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

/* Stand-in for the proprietary "Aureate" heading face declared in Branding.json.
   The CSS stack tries "Aureate" first, so dropping the licensed files in later
   picks it up with zero code changes. */
const aureate = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-aureate",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(brand.site),
  title: {
    default: "Dr Joy Dental Clinics — The Art of the Smile | Dubai",
    template: "%s | Dr Joy Dental Clinics",
  },
  description:
    "Award-winning dental clinics in Dubai since 2004. 13 clinics, 100+ dentists, 700K+ smiles. Invisalign, implants, veneers and every speciality under one roof — with our own in-house laboratory.",
  keywords: [
    "dental clinic Dubai",
    "Invisalign Dubai",
    "dental implants Dubai",
    "veneers Dubai",
    "Hollywood smile Dubai",
    "Dr Joy Dental Clinic",
  ],
  openGraph: {
    title: "Dr Joy Dental Clinics — The Art of the Smile",
    description:
      "Award-winning dental clinics in Dubai since 2004. 13 clinics, 100+ dentists, 700K+ smiles.",
    url: brand.site,
    siteName: brand.name,
    images: [{ url: "/frame/frame (1).webp", width: 1280, height: 720 }],
    locale: "en_US",
    type: "website",
  },
  icons: { icon: "/logo/cropped-img-fav-32x32.webp" },
};

export const viewport: Viewport = {
  themeColor: "#FEFEFE",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Dentist",
  name: brand.name,
  url: brand.site,
  logo: `${brand.site}/wp-content/uploads/2026/03/img-logo-png-192x.png`,
  telephone: "+971 800 37569",
  foundingDate: "2004",
  slogan: "The Art of the Smile",
  award: "Superbrands Award",
  department: clinics.map((c) => ({
    "@type": "Dentist",
    name: `${brand.name} — ${c.name}`,
    address: { "@type": "PostalAddress", streetAddress: c.address, addressLocality: "Dubai", addressCountry: "AE" },
    telephone: c.phone,
  })),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${manrope.variable} ${aureate.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
