import NewsLetterSection from './NewsLetterSection';
import LinksSection from './LinksSection';
import LayoutSpacing from './LayoutSpacing';
import Link from 'next/link';
import Image from 'next/image';
import { socialsData, paymentBadgesData } from './footerData';

function cn(classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Footer() {
  return (
    <footer className=" bg-black">
      
      <div className="pt-6 sm:pt-8 md:pt-[50px] container mx-auto px-3 sm:px-4 pb-4 ">
        <div className="max-w-frame mx-auto">
          <nav className="lg:grid lg:grid-cols-12 mb-4 sm:mb-6 md:mb-8">
            <div className="flex flex-col lg:col-span-3 lg:max-w-[248px]">
              <Link href="/" className=" mb-4 sm:mb-6 flex items-center ">
              <Image
                  src="/logo1.png"
                  alt="Logo"
                  width={200}
                  height={200}
                  className='w-10 h-10 sm:w-14 sm:h-12 md:w-16 md:h-14'
                  style={{ height: "auto" }}
                />
                  <h1 className="text-base sm:text-lg lg:text-2xl font-bold text-white">
                    Digicam Market
                  </h1>
              </Link>
              <p className="text-white/60 text-xs sm:text-sm mb-6 sm:mb-9">
                Cameras and photographic equipment chosen not only for performance, but for character. Built for professionals, cherished by enthusiasts.
              </p>
              <div className="flex items-center">
                {socialsData.map((social) => (
                  <Link
                    href={social.url}
                    key={social.id}
                    className="bg-white hover:bg-gray-200 hover:text-black transition-all mr-2 sm:mr-3 w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-white/20 flex items-center justify-center p-1 sm:p-1.5 text-black"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Follow us on ${social.name}`}
                  >
                    {social.icon}
                  </Link>
                ))}
              </div>
            </div>
            <div className="hidden lg:grid col-span-9 lg:grid-cols-4 lg:pl-10">
              <LinksSection />
            </div>
            <div className="grid lg:hidden grid-cols-2 sm:grid-cols-4">
              <LinksSection />
            </div>
          </nav>

          <hr className="h-[1px] border-t-white/10 mb-4 sm:mb-6" />
          <div className="flex flex-col sm:flex-row justify-center sm:justify-between items-center mb-2">
            <p className="text-xs sm:text-sm text-center sm:text-left text-white/60 mb-3 sm:mb-0 sm:mr-1">
              Digicam Market © {new Date().getFullYear()} Made by{" "}
              <Link
                href="https://rianhasansiam.me"
                className="text-white font-medium hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Rian Hasan Siam
              </Link>
              {", "}
              All rights reserved.
            </p>
            <div className="flex items-center">
              {paymentBadgesData.map((badge, _, arr) => (
                <span
                  key={badge.id}
                  className={cn([
                    arr.length !== badge.id && "mr-2 sm:mr-3",
                    "w-[38px] h-[24px] sm:w-[46px] sm:h-[30px] rounded-[5px] border border-[#D6DCE5] bg-white flex items-center justify-center",
                  ])}
                >
                  <Image
                    priority
                    src={badge.srcUrl}
                    width={33}
                    height={100}
                    alt="Payment method"
                    className="max-h-[12px] sm:max-h-[15px] object-contain"
                    style={{ height: "auto" }}
                  />
                </span>
              ))}
            </div>
          </div>
        </div>
        <LayoutSpacing />
      </div>
    </footer>
  );
}
