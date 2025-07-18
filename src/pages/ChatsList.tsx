import { useEffect, useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import useChat from "@/hooks/useChat";
import { tokenStorage } from "@/api/apiClient";
import { useQuery } from "@tanstack/react-query";
import { organizationService } from "./OrganizationsPage";
import { useChatStore } from "@/store/chatStore";
import { adminUserService } from "@/api/services/adminUserService";
import { useNavigate } from "react-router-dom";
import chatServices from "@/api/services/chatService";
import Loader from "@/components/Loader";
import { ChatCreationModal } from "@/components/ChatCreationModal";

// Import the new modular components
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatSearchAndActions } from "@/components/chat/ChatSearchAndActions";
import { ChatFilters } from "@/components/chat/ChatFilters";
import { ConversationItem } from "@/components/chat/ConversationItem";
import { GroupChatModal } from "@/components/chat/GroupChatModal";

export default function ChatsList() {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedFilter, setSelectedFilter] = useState("all");
	const [isCreatingDirectChat, setIsCreatingDirectChat] = useState(false);
	const [isCreatingGroupChat, setIsCreatingGroupChat] = useState(false);
	const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

	const { user } = useAuth();
	const navigate = useNavigate();

	const {
		data: all_users = [],
		isLoading: loadingUsers,
		error: usersError,
	} = useQuery({
		queryKey: ["support-worker-organizations"],
		queryFn: async () => {
			if (user.role === "participant") {
				const workers = await chatServices.getMySupportWorkers();
				return workers;
			}
			if (user.role === "admin") {
				const workers = await adminUserService.getWorkers();
				const participants = await adminUserService.getParticipants();
				return [...workers.users, ...participants.users];
			}
			return [];
		},
	});

	const { data: organizations = [], isLoading: loadingOrganizations } =
		useQuery({
			queryKey: ["organizations"],
			queryFn: async () => {
				return await organizationService.getOrganizations();
			},
		});

	const {
		loadConversations,
		connect,
		loading,
		setLoading,
		cleanupSocketListeners,
		conversations: chatConversations,
		createNewConversation,
	} = useChat();

	const { setCurrentConversation } = useChatStore();

	useEffect(() => {
		const tokens = tokenStorage.getTokens();
		if (tokens?.access?.token) {
			connect(tokens.access.token);
			loadConversations(tokens.access.token);
		}

		return () => {
			cleanupSocketListeners();
		};
	}, []);

	const handleChatClick = (chatId: string) => {
		const tokens = tokenStorage.getTokens();
		const conv = chatConversations.find((conv) => conv._id === chatId) || null;
		if (tokens?.access?.token) {
			setCurrentConversation(conv);
			const basePath =
				user.role === "supportWorker"
					? "/support-worker"
					: user.role === "participant"
					? "/participant"
					: "/admin";
			navigate(`${basePath}/chat/${conv._id}`);
		}
	};

	const handleNewDirectChat = async (userId: string) => {
		const tokens = tokenStorage.getTokens();
		if (!tokens?.access?.token) return;

		try {
			setLoading(true);
			const newConversation = await createNewConversation(
				"direct",
				[userId],
				tokens.access.token,
				"Direct Chat",
				"Direct messaging",
				organizations[0]?._id
			);

			if (newConversation) {
				setCurrentConversation(newConversation);
				const basePath =
					user.role === "supportWorker"
						? "/support-worker"
						: user.role === "participant"
						? "/participant"
						: "/admin";
				navigate(`${basePath}/chat/${newConversation._id}`);
			}
		} catch (error) {
			console.error("Failed to create direct chat:", error);
		} finally {
			setLoading(false);
			setIsCreatingDirectChat(false);
		}
	};

	const handleCreateGroupChat = async (data: {
		name: string;
		description: string;
		selectedUsers: string[];
	}) => {
		const tokens = tokenStorage.getTokens();
		if (!tokens?.access?.token) return;

		try {
			setLoading(true);
			const newConversation = await createNewConversation(
				"group",
				data.selectedUsers,
				tokens.access.token,
				data.name,
				data.description,
				organizations[0]?._id
			);

			if (newConversation) {
				setCurrentConversation(newConversation);
				const basePath =
					user.role === "supportWorker"
						? "/support-worker"
						: user.role === "participant"
						? "/participant"
						: "/admin";
				navigate(`${basePath}/chat/${newConversation._id}`);
			}
		} catch (error) {
			console.error("Failed to create group chat:", error);
		} finally {
			setLoading(false);
			setIsCreatingGroupChat(false);
		}
	};

	const toggleUserSelection = (userId: string) => {
		setSelectedUsers((prev) =>
			prev.includes(userId)
				? prev.filter((id) => id !== userId)
				: [...prev, userId]
		);
	};

	const filteredConversations = chatConversations.filter((conv) => {
		const matchesSearch =
			searchQuery === "" ||
			(conv.type === "direct" &&
				conv.members
					.map((m) => m.userId.firstName)
					.join(" ")
					.toLowerCase()
					.includes(searchQuery.toLowerCase())) ||
			(conv.type === "group" &&
				conv.name?.toLowerCase().includes(searchQuery.toLowerCase()));

		const matchesFilter =
			selectedFilter === "all" ||
			(selectedFilter === "direct" && conv.type === "direct") ||
			(selectedFilter === "group" && conv.type === "group");

		return matchesSearch && matchesFilter;
	});

	const filters = [
		{
			key: "all",
			label: "All Chats",
			count: chatConversations.length,
		},
		{
			key: "direct",
			label: "Individual",
			count: chatConversations.filter((c) => c.type === "direct").length,
		},
		{
			key: "group",
			label: "Groups",
			count: chatConversations.filter((c) => c.type === "group").length,
		},
	];

	if (loadingUsers || loadingOrganizations) {
		return <Loader />;
	}

	return (
		<div className="min-h-screen bg-[#f8fafc]">
			<div className="container mx-4 p-4 max-w-7xl">
				<ChatHeader />

				<div className="grid lg:grid-cols-4 gap-6">
					{/* Chat List Sidebar */}
					<div className="lg:col-span-1 space-y-4">
						<ChatSearchAndActions
							searchQuery={searchQuery}
							onSearchChange={setSearchQuery}
							onNewDirectChat={() => setIsCreatingDirectChat(true)}
							onNewGroupChat={() => setIsCreatingGroupChat(true)}
							showCreateActions={user.role !== "supportWorker"}
						/>

						<ChatFilters
							selectedFilter={selectedFilter}
							onFilterChange={setSelectedFilter}
							filters={filters}
						/>
					</div>

					{/* Main Content Area */}
					<div className="lg:col-span-3">
						{/* Direct Chat Creation Modal */}
						{isCreatingDirectChat && (
							<ChatCreationModal
								isOpen={isCreatingDirectChat}
								onClose={() => {
									setIsCreatingDirectChat(false);
									setSelectedUsers([]);
								}}
								chatType="direct"
								users={all_users}
								selectedUsers={selectedUsers}
								onUserSelect={toggleUserSelection}
								groupName=""
								onGroupNameChange={() => {}}
								onCreate={() => handleNewDirectChat(selectedUsers[0])}
								isLoading={loading}
							/>
						)}

						{/* Group Chat Creation Modal */}
						<GroupChatModal
							isOpen={isCreatingGroupChat}
							onClose={() => setIsCreatingGroupChat(false)}
							users={all_users}
							onCreateGroup={handleCreateGroupChat}
							isLoading={loading}
						/>

						{/* Conversations List */}
						<Card className="shadow-xl border-0 bg-white">
							<CardHeader className="border-b border-[#9395A2]/20">
								<div className="flex items-center justify-between">
									<div>
										<CardTitle className="text-xl">Conversations</CardTitle>
										<CardDescription>
											{filteredConversations.length} conversation
											{filteredConversations.length !== 1 ? "s" : ""}
										</CardDescription>
									</div>
								</div>
							</CardHeader>

							<CardContent className="p-0">
								<div className="max-h-[600px] overflow-y-auto">
									{filteredConversations.length === 0 ? (
										<div className="p-8 text-center">
											<MessageCircle className="h-12 w-12 text-[#9395A2] mx-auto mb-4" />
											<h3 className="text-lg font-medium text-[#9395A2] mb-2">
												No conversations found
											</h3>
											<p className="text-[#9395A2] mb-4">
												Try adjusting your search or filters
											</p>
											{user.role !== "supportWorker" && (
												<Button
													onClick={() => setIsCreatingDirectChat(true)}
													className="bg-[#008CFF] hover:bg-[#008CFF]/90"
												>
													<Plus className="h-4 w-4 mr-2" />
													Start Chat
												</Button>
											)}
										</div>
									) : (
										<div className="divide-y divide-[#9395A2]/10">
											{filteredConversations.map((conversation) => (
												<ConversationItem
													key={conversation._id}
													conversation={conversation}
													currentUserId={user._id}
													onClick={handleChatClick}
												/>
											))}
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
