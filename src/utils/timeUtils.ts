export const formatMessageTime = (timestamp: string) => {
	const date = new Date(timestamp);
	const now = new Date();
	const diffInMinutes = Math.floor(
		(now.getTime() - date.getTime()) / (1000 * 60)
	);

	if (diffInMinutes < 1) return "now";
	if (diffInMinutes < 60) return `${diffInMinutes}m`;
	if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
	if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d`;
	return date.toLocaleDateString();
};
