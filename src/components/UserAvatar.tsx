import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
  avatarUrl?: string | null;
  email?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-16 w-16",
  xl: "h-20 w-20",
};

export const UserAvatar = ({ avatarUrl, email, size = "md" }: UserAvatarProps) => {
  // Generate random fun character avatar using DiceBear API
  const getRandomAvatar = () => {
    if (!email) return "";
    const styles = ["adventurer", "bottts", "fun-emoji", "lorelei", "pixel-art"];
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    const seed = email || Math.random().toString();
    return `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${seed}`;
  };

  return (
    <Avatar className={sizeClasses[size]}>
      <AvatarImage 
        src={avatarUrl || getRandomAvatar()} 
        alt="Profile picture" 
        className="object-cover scale-110"
      />
      <AvatarFallback>
        {email?.charAt(0).toUpperCase() || "U"}
      </AvatarFallback>
    </Avatar>
  );
};
