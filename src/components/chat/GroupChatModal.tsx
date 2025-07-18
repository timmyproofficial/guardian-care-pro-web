import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Search, Users, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface User {
	_id: string;
	firstName: string;
	lastName: string;
	profileImage?: string;
	role: string;
}

interface GroupChatModalProps {
	isOpen: boolean;
	onClose: () => void;
	users: User[];
	onCreateGroup: (data: {
		name: string;
		description: string;
		selectedUsers: string[];
	}) => void;
	isLoading?: boolean;
}

export function GroupChatModal({
	isOpen,
	onClose,
	users,
	onCreateGroup,
	isLoading = false,
}: GroupChatModalProps) {
	const [groupName, setGroupName] = useState("");
	const [groupDescription, setGroupDescription] = useState("");
	const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
	const [searchQuery, setSearchQuery] = useState("");

	const filteredUsers = users.filter(
		(user) =>
			user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			user.lastName.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const handleUserToggle = (userId: string) => {
		setSelectedUsers((prev) =>
			prev.includes(userId)
				? prev.filter((id) => id !== userId)
				: [...prev, userId]
		);
	};

	const handleCreate = () => {
		if (groupName.trim() && selectedUsers.length >= 2) {
			onCreateGroup({
				name: groupName,
				description: groupDescription,
				selectedUsers,
			});
			handleClose();
		}
	};

	const handleClose = () => {
		setGroupName("");
		setGroupDescription("");
		setSelectedUsers([]);
		setSearchQuery("");
		onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Users className="h-5 w-5 text-[#008CFF]" />
						Create Group Chat
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-6">
					{/* Group Info */}
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="groupName">Group Name *</Label>
							<Input
								id="groupName"
								value={groupName}
								onChange={(e) => setGroupName(e.target.value)}
								placeholder="Enter group name"
								className="border-[#9395A2] focus:border-[#008CFF]"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="groupDescription">Description</Label>
							<Textarea
								id="groupDescription"
								value={groupDescription}
								onChange={(e) => setGroupDescription(e.target.value)}
								placeholder="Enter group description (optional)"
								rows={3}
								className="border-[#9395A2] focus:border-[#008CFF]"
							/>
						</div>
					</div>

					{/* Selected Users */}
					{selectedUsers.length > 0 && (
						<div className="space-y-2">
							<Label>Selected Members ({selectedUsers.length})</Label>
							<div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
								{selectedUsers.map((userId) => {
									const user = users.find((u) => u._id === userId);
									return user ? (
										<div
											key={userId}
											className="flex items-center gap-2 bg-[#008CFF]/10 text-[#008CFF] px-3 py-1 rounded-full text-sm"
										>
											<span>{user.firstName}</span>
											<button
												onClick={() => handleUserToggle(userId)}
												className="hover:bg-[#008CFF]/20 rounded-full p-1"
											>
												<X className="h-3 w-3" />
											</button>
										</div>
									) : null;
								})}
							</div>
						</div>
					)}

					{/* User Search */}
					<div className="space-y-2">
						<Label>Add Members</Label>
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#9395A2]" />
							<Input
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Search users..."
								className="pl-10 border-[#9395A2] focus:border-[#008CFF]"
							/>
						</div>
					</div>

					{/* Users List */}
					<div className="space-y-2">
						<div className="max-h-60 overflow-y-auto border rounded-lg">
							{filteredUsers.map((user) => (
								<div
									key={user._id}
									className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
									onClick={() => handleUserToggle(user._id)}
								>
									<Checkbox
										checked={selectedUsers.includes(user._id)}
										onChange={() => handleUserToggle(user._id)}
									/>
									<Avatar className="h-8 w-8">
										<AvatarImage src={user.profileImage} />
										<AvatarFallback className="bg-[#008CFF] text-white text-sm">
											{user.firstName[0]}
										</AvatarFallback>
									</Avatar>
									<div className="flex-1">
										<p className="font-medium text-sm">
											{user.firstName} {user.lastName}
										</p>
										<p className="text-xs text-[#9395A2]">{user.role}</p>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Actions */}
					<div className="flex justify-end gap-3 pt-4 border-t">
						<Button
							variant="outline"
							onClick={handleClose}
							disabled={isLoading}
						>
							Cancel
						</Button>
						<Button
							onClick={handleCreate}
							disabled={
								!groupName.trim() || selectedUsers.length < 2 || isLoading
							}
							className="bg-[#008CFF] hover:bg-[#008CFF]/90"
						>
							{isLoading ? "Creating..." : "Create Group"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
