import { ConversationAvatar } from "./ConversationAvatar";
import { formatMessageTime } from "@/utils/timeUtils";

interface ConversationItemProps {
	conversation: any;
	currentUserId: string;
	onClick: (conversationId: string) => void;
}

export function ConversationItem({
	conversation,
	currentUserId,
	onClick,
}: ConversationItemProps) {
	const otherUser =
		conversation.type === "direct"
			? conversation.members.find(
					(member) => member.userId._id !== currentUserId
			  )?.userId
			: null;

	const displayName =
		conversation.type === "direct" ? otherUser?.firstName : conversation.name;

	return (
		<div
			onClick={() => onClick(conversation._id)}
			className="p-4 hover:bg-[#66C2EB20] cursor-pointer transition-all duration-200"
		>
			<div className="flex items-center gap-4">
				<ConversationAvatar
					conversation={conversation}
					currentUserId={currentUserId}
					size="md"
				/>

				<div className="flex-1 min-w-0">
					<div className="flex items-center justify-between mb-1">
						<div className="flex items-center gap-2">
							<h3 className="font-semibold text-slate-900 truncate">
								{displayName}
							</h3>
							{conversation.type === "group" && (
								<span className="text-xs text-[#9395A2] bg-[#9395A2]/10 px-2 py-1 rounded-full">
									{conversation.members.length} members
								</span>
							)}
						</div>
						<div className="flex items-center gap-2">
							{conversation.lastMessage?.timestamp && (
								<span className="text-xs text-[#9395A2]">
									{formatMessageTime(conversation.lastMessage.timestamp)}
								</span>
							)}
						</div>
					</div>

					<div className="flex items-center justify-between">
						<div className="flex-1">
							{conversation.type === "direct" && otherUser && (
								<p className="text-xs text-[#9395A2] mb-1">
									{otherUser.role} •
									{otherUser.isOnline ? (
										<span className="text-[#197879] ml-1">Online</span>
									) : (
										<span className="ml-1">
											{conversation.lastMessage?.timestamp &&
												formatMessageTime(conversation.lastMessage.timestamp)}
										</span>
									)}
								</p>
							)}
							<p className="text-sm truncate">
								{conversation.lastMessage ? (
									<>
										{conversation.type === "group" &&
											conversation.lastMessage.sender._id !== currentUserId && (
												<span className="text-[#008CFF] font-medium mr-1">
													{conversation.lastMessage.sender.firstName}:
												</span>
											)}
										{conversation.lastMessage.content}
									</>
								) : (
									"No messages yet"
								)}
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
