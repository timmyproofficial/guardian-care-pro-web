import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Users } from "lucide-react";

interface User {
	_id: string;
	firstName: string;
	profileImage?: string;
	isOnline?: boolean;
}

interface ConversationAvatarProps {
	conversation: {
		type: "direct" | "group";
		members: Array<{ userId: User }>;
		isActive?: boolean;
	};
	currentUserId: string;
	size?: "sm" | "md" | "lg";
}

export function ConversationAvatar({
	conversation,
	currentUserId,
	size = "md",
}: ConversationAvatarProps) {
	const sizeClasses = {
		sm: "h-8 w-8",
		md: "h-10 w-10",
		lg: "h-12 w-12",
	};

	const iconSizeClasses = {
		sm: "h-4 w-4",
		md: "h-5 w-5",
		lg: "h-6 w-6",
	};

	if (conversation.type === "direct") {
		const otherUser = conversation.members.find(
			(member) => member.userId._id !== currentUserId
		)?.userId;

		if (!otherUser) return null;

		return (
			<div className="relative">
				<Avatar className={`${sizeClasses[size]} ring-2 ring-white shadow-md`}>
					<AvatarImage
						className={`${sizeClasses[size]} rounded-full object-cover`}
						src={otherUser.profileImage}
					/>
					<AvatarFallback className="bg-[#008CFF] text-white font-semibold">
						{otherUser.firstName[0]}
					</AvatarFallback>
				</Avatar>
				{otherUser.isOnline && (
					<div className="absolute -bottom-1 -right-1 h-4 w-4 bg-[#197879] rounded-full ring-2 ring-white"></div>
				)}
			</div>
		);
	}

	// Group chat avatar with cascading member avatars
	const visibleMembers = conversation.members
		.filter((member) => member.userId._id !== currentUserId)
		.slice(0, 3);

	return (
		<div className="relative">
			<div
				className={`${sizeClasses[size]} bg-[#008CFF] rounded-full flex items-center justify-center shadow-md`}
			>
				<Users className={`${iconSizeClasses[size]} text-white`} />
			</div>

			{/* Cascading member avatars */}
			<div className="absolute -bottom-2 -right-2 flex">
				{visibleMembers.map((member, index) => (
					<Avatar
						key={member.userId._id}
						className={`h-4 w-4 ring-1 ring-white ${index > 0 ? "-ml-1" : ""}`}
					>
						<AvatarImage
							className="h-4 w-4 rounded-full object-cover"
							src={member.userId.profileImage}
						/>
						<AvatarFallback className="bg-[#008CFF] text-white text-xs font-semibold">
							{member.userId.firstName[0]}
						</AvatarFallback>
					</Avatar>
				))}
				{conversation.members.length > 4 && (
					<div className="h-4 w-4 bg-[#9395A2] rounded-full flex items-center justify-center text-xs text-white font-bold -ml-1">
						+{conversation.members.length - 4}
					</div>
				)}
			</div>
		</div>
	);
}
