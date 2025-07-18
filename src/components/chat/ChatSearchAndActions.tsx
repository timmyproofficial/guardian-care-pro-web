import { Search, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatSearchAndActionsProps {
	searchQuery: string;
	onSearchChange: (query: string) => void;
	onNewDirectChat: () => void;
	onNewGroupChat: () => void;
	showCreateActions?: boolean;
}

export function ChatSearchAndActions({
	searchQuery,
	onSearchChange,
	onNewDirectChat,
	onNewGroupChat,
	showCreateActions = true,
}: ChatSearchAndActionsProps) {
	return (
		<Card className="shadow-lg border-0 bg-white">
			<CardHeader className="pb-4">
				{showCreateActions && (
					<div className="flex items-center justify-between">
						<CardTitle className="text-lg">Quick Actions</CardTitle>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="outline"
									size="icon"
									className="hover:bg-blue-50"
								>
									<UserPlus className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent>
								<DropdownMenuItem onClick={onNewDirectChat}>
									New Chat
								</DropdownMenuItem>
								<DropdownMenuItem onClick={onNewGroupChat}>
									Group Chat
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				)}
			</CardHeader>
			<CardContent className="space-y-3">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#9395A2]" />
					<Input
						placeholder="Search conversations..."
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						className="pl-10 border-[#9395A2] focus:border-[#008CFF]"
					/>
				</div>
			</CardContent>
		</Card>
	);
}
