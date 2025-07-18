import { MessageCircle, Bell, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatHeaderProps {
	totalUnreadCount?: number;
}

export function ChatHeader({ totalUnreadCount = 0 }: ChatHeaderProps) {
	return (
		<div className="flex items-center justify-between mb-6">
			<div className="flex items-center gap-4">
				<div className="relative">
					<MessageCircle className="h-8 w-8 text-[#008CFF]" />
					{totalUnreadCount > 0 && (
						<div className="absolute -top-2 -right-2 h-5 w-5 bg-[#FF2D55] rounded-full flex items-center justify-center">
							<span className="text-xs text-white font-bold">
								{totalUnreadCount > 9 ? "9+" : totalUnreadCount}
							</span>
						</div>
					)}
				</div>
				<div>
					<h1 className="text-3xl font-bold text-slate-900">Messages</h1>
					<p className="text-[#9395A2]">Manage your conversations</p>
				</div>
			</div>

			<div className="flex items-center gap-2">
				<Button variant="outline" size="icon" className="hover:bg-blue-50">
					<Bell className="h-4 w-4" />
				</Button>
				<Button variant="outline" size="icon" className="hover:bg-blue-50">
					<Settings className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}
