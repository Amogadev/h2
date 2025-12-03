import { LoginForm } from "@/components/auth/login-form";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function LoginPage() {
  const loginBg = PlaceHolderImages.find(p => p.id === 'login-background');
  
  return (
    <div className="relative flex items-center justify-center min-h-screen">
      <div className="absolute inset-0 w-full h-full">
        <Image
          src={loginBg?.imageUrl || "https://picsum.photos/seed/hotelLobby/1920/1080"}
          alt={loginBg?.description || "Hotel Lobby"}
          layout="fill"
          objectFit="cover"
          className="z-0"
          data-ai-hint={loginBg?.imageHint || "hotel lobby"}
        />
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm"></div>
      </div>
      <div className="relative z-10 w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
}
