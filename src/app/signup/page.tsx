import { SignupForm } from "@/components/auth/signup-form";
import Image from "next/image";

export default function SignupPage() {
  return (
    <div className="relative flex items-center justify-center min-h-screen">
      <div className="absolute inset-0 w-full h-full">
        <Image
          src="https://picsum.photos/seed/hotelLobby/1920/1080"
          alt="Hotel Lobby"
          layout="fill"
          objectFit="cover"
          className="z-0"
          data-ai-hint="hotel lobby"
        />
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm"></div>
      </div>
      <div className="relative z-10 w-full max-w-md">
        <SignupForm />
      </div>
    </div>
  );
}
