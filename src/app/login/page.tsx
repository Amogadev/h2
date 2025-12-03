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
          alt={loginBg?.description || "A background image of a modern hotel lobby"}
          layout="fill"
          objectFit="cover"
          className="z-0"
          data-ai-hint={loginBg?.imageHint || "hotel lobby"}
          priority
        />
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm"></div>
      </div>
      {/* Centered login form */}
      <div className="relative z-10 w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
