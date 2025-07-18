import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FilterOption {
	key: string;
	label: string;
	count: number;
}

interface ChatFiltersProps {
	selectedFilter: string;
	onFilterChange: (filter: string) => void;
	filters: FilterOption[];
}

export function ChatFilters({
	selectedFilter,
	onFilterChange,
	filters,
}: ChatFiltersProps) {
	return (
		<Card className="shadow-lg border-0 bg-white">
			<CardHeader className="pb-4">
				<CardTitle className="text-lg">Filters</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2">
				{filters.map((filter) => (
					<Button
						key={filter.key}
						variant={selectedFilter === filter.key ? "default" : "ghost"}
						className={`w-full justify-between ${
							selectedFilter === filter.key
								? "bg-[#008CFF] text-white"
								: "hover:bg-blue-50"
						}`}
						onClick={() => onFilterChange(filter.key)}
					>
						<span>{filter.label}</span>
						<span
							className={`text-xs px-2 py-1 rounded-full ${
								selectedFilter === filter.key
									? "bg-white/20 text-white"
									: "bg-[#9395A2]/20 text-[#9395A2]"
							}`}
						>
							{filter.count}
						</span>
					</Button>
				))}
			</CardContent>
		</Card>
	);
}
