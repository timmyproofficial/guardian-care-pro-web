import React, { useState, useEffect } from "react";
import {
	Search,
	Filter,
	Plus,
	Eye,
	Trash2,
	CheckCircle,
	Clock,
	AlertTriangle,
	FileText,
	FilterIcon,
	Download,
	ChevronDown,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import incidentService from "@/api/services/incidentService";
import { IIncident, TIncidentStatus } from "@/types/incidents.types";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { toast } from "sonner";
import CreateIncidentModal from "@/components/CreateIncidentModal";
import IncidentDetailsModal from "@/components/IncidentDetailsModal";
import ResolveIncidentModal from "@/components/ResolveIncidentModal";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const IncidentAdminDashboard = () => {
	const { user } = useAuth();
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	// Fetch incidents
	const {
		data: incidentsData,
		error: incidentsError,
		isLoading: isIncidentsLoading,
	} = useQuery({
		queryKey: ["incidents"],
		queryFn: () => incidentService.getIncidents(),
	});

	// State management
	const [filteredIncidents, setFilteredIncidents] = useState<IIncident[]>([]);
	const [selectedIncident, setSelectedIncident] = useState<IIncident | null>(
		null
	);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("ALL");
	const [severityFilter, setSeverityFilter] = useState("ALL");
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage] = useState(10);

	// Separate modal states
	const [modals, setModals] = useState({
		create: false,
		details: false,
		resolve: false,
		delete: false,
	});

	const [incidentToDelete, setIncidentToDelete] = useState<IIncident | null>(
		null
	);

	// Helper function to open modal - FIXED: Close all other modals first
	const openModal = (modalType: keyof typeof modals, incident?: IIncident) => {
		// Close all modals first and wait for state to update
		setModals({
			create: false,
			details: false,
			resolve: false,
			delete: false,
		});

		// Set the selected incident if provided
		if (incident) {
			setSelectedIncident(incident);
		}

		// Use setTimeout to ensure state updates before opening new modal
		setTimeout(() => {
			setModals((prev) => ({ ...prev, [modalType]: true }));
		}, 100);
	};

	// Helper function to close modal - FIXED: Clear selected incident properly
	const closeModal = (modalType: keyof typeof modals) => {
		setModals((prev) => ({ ...prev, [modalType]: false }));

		// Use setTimeout to ensure modal closes before clearing state
		setTimeout(() => {
			// Clear selected incident when closing any modal except create
			if (modalType !== "create") {
				setSelectedIncident(null);
			}

			// Clear incident to delete when closing delete modal
			if (modalType === "delete") {
				setIncidentToDelete(null);
			}
		}, 100);
	};

	const handleResolveFromDetails = (incident: IIncident) => {
		// Close details modal first
		closeModal("details");

		// Wait for details modal to close, then open resolve modal
		setTimeout(() => {
			setSelectedIncident(incident);
			setModals((prev) => ({ ...prev, resolve: true }));
		}, 150);
	};

	// Calculate stats from real data - ONLY FOR ADMIN
	const stats =
		user?.role === "admin"
			? {
					totalIncidents: incidentsData?.incidents.length || 0,
					byStatus: {
						OPEN:
							incidentsData?.incidents.filter(
								(incident) => incident.status === "OPEN"
							).length || 0,
						IN_REVIEW:
							incidentsData?.incidents.filter(
								(incident) => incident.status === "IN_REVIEW"
							).length || 0,
						RESOLVED:
							incidentsData?.incidents.filter(
								(incident) => incident.status === "RESOLVED"
							).length || 0,
						REJECTED:
							incidentsData?.incidents.filter(
								(incident) => incident.status === "REJECTED"
							).length || 0,
					},
					bySeverity: {
						LOW:
							incidentsData?.incidents.filter(
								(incident) => incident.severity === "LOW"
							).length || 0,
						MEDIUM:
							incidentsData?.incidents.filter(
								(incident) => incident.severity === "MEDIUM"
							).length || 0,
						HIGH:
							incidentsData?.incidents.filter(
								(incident) => incident.severity === "HIGH"
							).length || 0,
					},
					resolvedIncidents:
						incidentsData?.incidents.filter(
							(incident) => incident.status === "RESOLVED"
						).length || 0,
					averageResolutionTime: 24, // This would need to be calculated from your data
			  }
			: null;

	// Filter incidents based on search and filters
	useEffect(() => {
		if (incidentsData?.incidents) {
			let filtered = [...incidentsData.incidents];

			if (searchTerm) {
				filtered = filtered.filter(
					(incident) =>
						incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
						incident.description
							.toLowerCase()
							.includes(searchTerm.toLowerCase())
				);
			}

			if (statusFilter !== "ALL") {
				filtered = filtered.filter(
					(incident) => incident.status === statusFilter
				);
			}

			if (severityFilter !== "ALL") {
				filtered = filtered.filter(
					(incident) => incident.severity === severityFilter
				);
			}

			setFilteredIncidents(filtered);
			setCurrentPage(1);
		}
	}, [searchTerm, statusFilter, severityFilter, incidentsData]);

	// Download functions
	const downloadPDF = (incidents: IIncident[]) => {
		const doc = new jsPDF();

		// Add title
		doc.setFontSize(18);
		doc.text("Incident Report", 14, 22);

		// Add generation date
		doc.setFontSize(10);
		doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

		// Prepare data for table
		const tableData = incidents.map((incident) => [
			incident.title,
			incident.status,
			incident.severity,
			`${incident.reportedBy.firstName} ${incident.reportedBy.lastName}`,
			new Date(incident.createdAt).toLocaleDateString(),
			incident.description.substring(0, 100) +
				(incident.description.length > 100 ? "..." : ""),
		]);

		// Add table
		doc.autoTable({
			head: [
				["Title", "Status", "Severity", "Reported By", "Date", "Description"],
			],
			body: tableData,
			startY: 40,
			styles: { fontSize: 8 },
			headStyles: { fillColor: [23, 170, 236] },
			margin: { top: 40 },
		});

		// Save the PDF
		doc.save(`incidents-report-${new Date().toISOString().split("T")[0]}.pdf`);
		toast.success("PDF downloaded successfully");
	};

	const downloadCSV = (incidents: IIncident[]) => {
		const headers = [
			"Title",
			"Status",
			"Severity",
			"Reported By",
			"Date",
			"Description",
			"Resolution Note",
		];

		const csvData = incidents.map((incident) => [
			incident.title,
			incident.status,
			incident.severity,
			`${incident.reportedBy.firstName} ${incident.reportedBy.lastName}`,
			new Date(incident.createdAt).toLocaleDateString(),
			incident.description.replace(/,/g, ";"), // Replace commas to avoid CSV issues
			incident.resolutionNote || "N/A",
		]);

		const csvContent = [headers, ...csvData]
			.map((row) => row.map((cell) => `"${cell}"`).join(","))
			.join("\n");

		const blob = new Blob([csvContent], { type: "text/csv" });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `incidents-report-${
			new Date().toISOString().split("T")[0]
		}.csv`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		window.URL.revokeObjectURL(url);
		toast.success("CSV downloaded successfully");
	};

	// Mutation for updating incident status
	const updateStatusMutation = useMutation({
		mutationFn: ({
			id,
			status,
			updatedBy,
		}: {
			id: string;
			status: TIncidentStatus;
			updatedBy: string;
		}) => incidentService.updateIncidentStatus(id, { status, updatedBy }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["incidents"] });
			toast.success("Incident status updated successfully");
		},
		onError: (error) => {
			toast.error("Failed to update incident status");
			console.error("Error updating status:", error);
		},
	});

	// Mutation for resolving incident
	const resolveIncidentMutation = useMutation({
		mutationFn: ({
			id,
			resolutionNote,
			resolvedBy,
		}: {
			id: string;
			resolutionNote: string;
			resolvedBy: string;
		}) => incidentService.resolveIncident(id, { resolutionNote, resolvedBy }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["incidents"] });
			toast.success("Incident resolved successfully");
			closeModal("resolve");
		},
		onError: (error) => {
			toast.error("Failed to resolve incident");
			console.error("Error resolving incident:", error);
			closeModal("resolve");
		},
	});

	// Mutation for deleting incidents
	const deleteIncidentMutation = useMutation({
		mutationFn: (id: string) => incidentService.deleteIncident(id),
		onSuccess: () => {
			// Reload incidents
			queryClient.invalidateQueries({ queryKey: ["incidents"] });
			toast.success("Incident deleted successfully");
			closeModal("delete");
		},
		onError: (error) => {
			toast.error("Failed to delete incident");
			console.error("Error deleting incident:", error);
		},
	});

	const getStatusColor = (status: string) => {
		const colors = {
			OPEN: "bg-red-100 text-red-800",
			IN_REVIEW: "bg-yellow-100 text-yellow-800",
			RESOLVED: "bg-green-100 text-green-800",
			REJECTED: "bg-gray-100 text-gray-800",
		};
		return colors[status] || "bg-gray-100 text-gray-800";
	};

	const getSeverityColor = (severity: string) => {
		const colors = {
			LOW: "bg-blue-100 text-blue-800",
			MEDIUM: "bg-orange-100 text-orange-800",
			HIGH: "bg-red-100 text-red-800",
		};
		return colors[severity] || "bg-gray-100 text-gray-800";
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const handleStatusUpdate = (
		incidentId: string,
		newStatus: TIncidentStatus,
		updatedBy: string
	) => {
		updateStatusMutation.mutate({
			id: incidentId,
			status: newStatus,
			updatedBy,
		});
	};

	const handleResolveIncident = (
		incidentId: string,
		resolutionNote: string,
		resolvedBy: string
	) => {
		resolveIncidentMutation.mutate({
			id: incidentId,
			resolutionNote,
			resolvedBy,
		});
	};

	const handleDeleteIncident = () => {
		if (incidentToDelete) {
			deleteIncidentMutation.mutate(incidentToDelete._id);
		}
	};

	// Check if user can delete incident
	const canDeleteIncident = (incident: IIncident) => {
		if (
			user?.role === "admin" ||
			(user.role === "supportWorker" && incident.reportedBy._id === user._id)
		)
			return true;
		return false;
	};

	// Check if user can resolve incident - ONLY ADMIN
	const canResolveIncident = (incident: IIncident) => {
		return user?.role === "admin" && incident.status !== "RESOLVED";
	};

	// Pagination
	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const currentItems = filteredIncidents.slice(
		indexOfFirstItem,
		indexOfLastItem
	);
	const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage);

	if (isIncidentsLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#20AFF0]"></div>
			</div>
		);
	}

	if (incidentsError) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-red-500">Error loading incidents</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen" style={{ backgroundColor: "#F9FCFF" }}>
			<div className="max-w-7xl mx-4 p-6">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						Incident Management
					</h1>
					<p className="text-gray-600">
						Monitor and manage all incidents across shifts
					</p>
				</div>

				{/* Statistics Cards - ONLY FOR ADMIN */}
				{user?.role === "admin" && stats && (
					<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
						<div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-gray-600">
										Total Incidents
									</p>
									<p className="text-2xl font-bold text-gray-900">
										{stats.totalIncidents}
									</p>
								</div>
								<FileText className="h-8 w-8 text-[#17AAEC]" />
							</div>
						</div>

						<div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-gray-600">
										Open Incidents
									</p>
									<p className="text-2xl font-bold text-red-600">
										{stats.byStatus.OPEN}
									</p>
								</div>
								<AlertTriangle className="h-8 w-8 text-red-500" />
							</div>
						</div>

						<div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-gray-600">Resolved</p>
									<p className="text-2xl font-bold text-green-600">
										{stats.resolvedIncidents}
									</p>
								</div>
								<CheckCircle className="h-8 w-8 text-green-500" />
							</div>
						</div>

						<div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-gray-600">
										Avg. Resolution
									</p>
									<p className="text-2xl font-bold text-blue-600">
										{stats.averageResolutionTime}h
									</p>
								</div>
								<Clock className="h-8 w-8 text-blue-500" />
							</div>
						</div>
					</div>
				)}

				{/* Filters, Search, and Export */}
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
					<div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
						<div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-guardian h-4 w-4" />
								<input
									type="text"
									placeholder="Search incidents..."
									className="pl-10 pr-4 py-2 border border-guardian/30 rounded-lg focus:ring-2 focus:ring-guardian focus:border-guardian w-full sm:w-64"
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
								/>
							</div>

							{/* Fixed Status Filter */}
							<Select.Root value={statusFilter} onValueChange={setStatusFilter}>
								<Select.Trigger className="inline-flex items-center justify-between text-guardian w-48 px-4 py-2 text-sm bg-white border border-guardian/30 rounded-lg hover:bg-guardian/10 hover:border-guardian/50 focus:outline-none focus:ring-2 focus:ring-[#17AAEC] focus:border-transparent">
									<div className="flex items-center gap-2">
										<Filter className="h-4 w-4 text-guardian" />
										<span>
											{statusFilter === "ALL" ? "All Statuses" : statusFilter}
										</span>
									</div>
									<ChevronDown className="h-4 w-4 text-guardian" />
								</Select.Trigger>
								<Select.Portal>
									<Select.Content
										className="overflow-hidden bg-white rounded-lg shadow-lg border border-gray-200 z-50"
										position="popper"
										sideOffset={5}
									>
										<Select.ScrollUpButton className="flex items-center justify-center h-6 bg-white text-guardian cursor-default">
											<ChevronDown className="h-4 w-4 rotate-180" />
										</Select.ScrollUpButton>
										<Select.Viewport className="p-1">
											<Select.Item
												value="ALL"
												className="relative flex items-center px-8 py-2 text-sm text-gray-900 rounded-md cursor-pointer hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
											>
												<Select.ItemText>All Statuses</Select.ItemText>
												<Select.ItemIndicator className="absolute left-2 flex items-center justify-center">
													<CheckCircle className="h-4 w-4" />
												</Select.ItemIndicator>
											</Select.Item>
											<Select.Item
												value="OPEN"
												className="relative flex items-center px-8 py-2 text-sm text-gray-900 rounded-md cursor-pointer hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
											>
												<Select.ItemText>Open</Select.ItemText>
												<Select.ItemIndicator className="absolute left-2 flex items-center justify-center">
													<CheckCircle className="h-4 w-4" />
												</Select.ItemIndicator>
											</Select.Item>
											<Select.Item
												value="IN_REVIEW"
												className="relative flex items-center px-8 py-2 text-sm text-gray-900 rounded-md cursor-pointer hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
											>
												<Select.ItemText>In Review</Select.ItemText>
												<Select.ItemIndicator className="absolute left-2 flex items-center justify-center">
													<CheckCircle className="h-4 w-4" />
												</Select.ItemIndicator>
											</Select.Item>
											<Select.Item
												value="RESOLVED"
												className="relative flex items-center px-8 py-2 text-sm text-gray-900 rounded-md cursor-pointer hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
											>
												<Select.ItemText>Resolved</Select.ItemText>
												<Select.ItemIndicator className="absolute left-2 flex items-center justify-center">
													<CheckCircle className="h-4 w-4" />
												</Select.ItemIndicator>
											</Select.Item>
											<Select.Item
												value="REJECTED"
												className="relative flex items-center px-8 py-2 text-sm text-gray-900 rounded-md cursor-pointer hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
											>
												<Select.ItemText>Rejected</Select.ItemText>
												<Select.ItemIndicator className="absolute left-2 flex items-center justify-center">
													<CheckCircle className="h-4 w-4" />
												</Select.ItemIndicator>
											</Select.Item>
										</Select.Viewport>
										<Select.ScrollDownButton className="flex items-center justify-center h-6 bg-white text-guardian cursor-default">
											<ChevronDown className="h-4 w-4" />
										</Select.ScrollDownButton>
									</Select.Content>
								</Select.Portal>
							</Select.Root>

							{/* Fixed Severity Filter */}
							<Select.Root
								value={severityFilter}
								onValueChange={setSeverityFilter}
							>
								<Select.Trigger className="inline-flex items-center justify-between text-guardian w-48 px-4 py-2 text-sm bg-white border border-guardian/30 rounded-lg hover:bg-guardian/10 hover:border-guardian/50 focus:outline-none focus:ring-2 focus:ring-[#17AAEC] focus:border-transparent">
									<div className="flex items-center gap-2">
										<FilterIcon className="h-4 w-4 text-guardian" />
										<span>
											{severityFilter === "ALL"
												? "All Severities"
												: severityFilter}
										</span>
									</div>
									<ChevronDown className="h-4 w-4 text-guardian" />
								</Select.Trigger>
								<Select.Portal>
									<Select.Content
										className="overflow-hidden bg-white rounded-lg shadow-lg border border-gray-200 z-50"
										position="popper"
										sideOffset={5}
									>
										<Select.ScrollUpButton className="flex items-center justify-center h-6 bg-white text-guardian cursor-default">
											<ChevronDown className="h-4 w-4 rotate-180" />
										</Select.ScrollUpButton>
										<Select.Viewport className="p-1">
											<Select.Item
												value="ALL"
												className="relative flex items-center px-8 py-2 text-sm text-gray-900 rounded-md cursor-pointer hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
											>
												<Select.ItemText>All Severities</Select.ItemText>
												<Select.ItemIndicator className="absolute left-2 flex items-center justify-center">
													<CheckCircle className="h-4 w-4" />
												</Select.ItemIndicator>
											</Select.Item>
											<Select.Item
												value="LOW"
												className="relative flex items-center px-8 py-2 text-sm text-gray-900 rounded-md cursor-pointer hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
											>
												<Select.ItemText>Low</Select.ItemText>
												<Select.ItemIndicator className="absolute left-2 flex items-center justify-center">
													<CheckCircle className="h-4 w-4" />
												</Select.ItemIndicator>
											</Select.Item>
											<Select.Item
												value="MEDIUM"
												className="relative flex items-center px-8 py-2 text-sm text-gray-900 rounded-md cursor-pointer hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
											>
												<Select.ItemText>Medium</Select.ItemText>
												<Select.ItemIndicator className="absolute left-2 flex items-center justify-center">
													<CheckCircle className="h-4 w-4" />
												</Select.ItemIndicator>
											</Select.Item>
											<Select.Item
												value="HIGH"
												className="relative flex items-center px-8 py-2 text-sm text-gray-900 rounded-md cursor-pointer hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
											>
												<Select.ItemText>High</Select.ItemText>
												<Select.ItemIndicator className="absolute left-2 flex items-center justify-center">
													<CheckCircle className="h-4 w-4" />
												</Select.ItemIndicator>
											</Select.Item>
										</Select.Viewport>
										<Select.ScrollDownButton className="flex items-center justify-center h-6 bg-white text-guardian cursor-default">
											<ChevronDown className="h-4 w-4" />
										</Select.ScrollDownButton>
									</Select.Content>
								</Select.Portal>
							</Select.Root>

							{/* Export Dropdown */}
							<DropdownMenu.Root>
								<DropdownMenu.Trigger asChild>
									<Button
										variant="outline"
										className="flex items-center py-5 gap-2 text-guardian border-guardian/30 hover:bg-guardian/50 hover:border-guardian/40"
									>
										<Download className="h-4 w-4 text-guardian" />
										Export
										<ChevronDown className="h-4 w-4 text-guardian" />
									</Button>
								</DropdownMenu.Trigger>
								<DropdownMenu.Portal>
									<DropdownMenu.Content
										className="min-w-32 bg-white rounded-lg shadow-lg border border-gray-200 p-1 z-50"
										sideOffset={5}
									>
										<DropdownMenu.Item
											className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-md cursor-pointer hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
											onClick={() => downloadPDF(filteredIncidents)}
										>
											<FileText className="h-4 w-4" />
											Download PDF
										</DropdownMenu.Item>
										<DropdownMenu.Item
											className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-md cursor-pointer hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
											onClick={() => downloadCSV(filteredIncidents)}
										>
											<FileText className="h-4 w-4" />
											Download CSV
										</DropdownMenu.Item>
									</DropdownMenu.Content>
								</DropdownMenu.Portal>
							</DropdownMenu.Root>
						</div>

						{user.role === "supportWorker" && (
							<Button
								className="flex items-center text-white gap-2 bg-guardian"
								onClick={() => {
									navigate("/support-worker/incidents/create");
								}}
							>
								Create Incident
							</Button>
						)}
					</div>
				</div>

				{/* Incidents Table */}
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead className="bg-gray-50 border-b border-gray-200">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Incident
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Status
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Severity
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Reported By
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Date
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{currentItems.map((incident) => (
									<tr key={incident._id} className="hover:bg-gray-50">
										<td className="px-6 py-4">
											<div>
												<div className="text-sm font-medium text-gray-900">
													{incident.title}
												</div>
												<div className="text-sm text-gray-500 truncate max-w-xs">
													{incident.description}
												</div>
											</div>
										</td>
										<td className="px-6 py-4">
											<span
												className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
													incident.status
												)}`}
											>
												{incident.status}
											</span>
										</td>
										<td className="px-6 py-4">
											<span
												className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(
													incident.severity
												)}`}
											>
												{incident.severity}
											</span>
										</td>
										<td className="px-6 py-4">
											<div className="text-sm text-gray-900">
												{incident.reportedBy.firstName}{" "}
												{incident.reportedBy.lastName}
											</div>
										</td>
										<td className="px-6 py-4 text-sm text-gray-500">
											{formatDate(incident.createdAt)}
										</td>
										<td className="px-6 py-4">
											<div className="flex items-center gap-2">
												{/* View Button - Available for all roles */}
												<button
													onClick={() => openModal("details", incident)}
													className="text-[#17AAEC] hover:text-[#1599D3] p-1"
													title="View Details"
												>
													<Eye className="h-4 w-4" />
												</button>

												{/* Download Button - Individual incident export */}
												<DropdownMenu.Root>
													<DropdownMenu.Trigger asChild>
														<button
															className="text-gray-600 hover:text-gray-800 p-1"
															title="Download Incident"
														>
															<Download className="h-4 w-4" />
														</button>
													</DropdownMenu.Trigger>
													<DropdownMenu.Portal>
														<DropdownMenu.Content
															className="min-w-32 bg-white rounded-lg shadow-lg border border-gray-200 p-1 z-50"
															sideOffset={5}
														>
															<DropdownMenu.Item
																className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-md cursor-pointer hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
																onClick={() => downloadPDF([incident])}
															>
																<FileText className="h-4 w-4" />
																PDF
															</DropdownMenu.Item>
															<DropdownMenu.Item
																className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-md cursor-pointer hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
																onClick={() => downloadCSV([incident])}
															>
																<FileText className="h-4 w-4" />
																CSV
															</DropdownMenu.Item>
														</DropdownMenu.Content>
													</DropdownMenu.Portal>
												</DropdownMenu.Root>

												{/* Resolve Button - Only for admin on non-resolved incidents */}
												{canResolveIncident(incident) && (
													<button
														onClick={() => openModal("resolve", incident)}
														className="text-green-600 hover:text-green-800 p-1"
														title="Resolve Incident"
													>
														<CheckCircle className="h-4 w-4" />
													</button>
												)}

												{/* Delete Button - Available based on role permissions */}
												{canDeleteIncident(incident) && (
													<button
														onClick={() => {
															setIncidentToDelete(incident);
															openModal("delete");
														}}
														className="text-red-600 hover:text-red-800 p-1"
														title="Delete Incident"
													>
														<Trash2 className="h-4 w-4" />
													</button>
												)}
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					{/* Pagination */}
					{totalPages > 1 && (
						<div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
							<div className="flex items-center justify-between">
								<div className="flex items-center">
									<p className="text-sm text-gray-700">
										Showing {indexOfFirstItem + 1} to{" "}
										{Math.min(indexOfLastItem, filteredIncidents.length)} of{" "}
										{filteredIncidents.length} results
									</p>
								</div>
								<div className="flex items-center gap-2">
									<button
										onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
										disabled={currentPage === 1}
										className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
									>
										Previous
									</button>
									{Array.from({ length: totalPages }, (_, i) => i + 1).map(
										(page) => (
											<button
												key={page}
												onClick={() => setCurrentPage(page)}
												className={`px-3 py-1 text-sm rounded-md ${
													currentPage === page
														? "bg-[#17AAEC] text-white"
														: "bg-white border border-gray-300 hover:bg-gray-50"
												}`}
											>
												{page}
											</button>
										)
									)}
									<button
										onClick={() =>
											setCurrentPage(Math.min(totalPages, currentPage + 1))
										}
										disabled={currentPage === totalPages}
										className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
									>
										Next
									</button>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Modal Components */}
			{selectedIncident && (
				<>
					{/* Details Modal */}
					<Dialog.Root
						open={modals.details}
						onOpenChange={(open) => !open && closeModal("details")}
					>
						<IncidentDetailsModal
							incident={selectedIncident}
							onStatusUpdate={handleStatusUpdate}
							onResolve={() => handleResolveFromDetails(selectedIncident)}
							onClose={() => closeModal("details")}
						/>
					</Dialog.Root>

					{/* Resolve Modal */}
					{selectedIncident && canResolveIncident(selectedIncident) && (
						<Dialog.Root
							open={modals.resolve}
							onOpenChange={(open) => !open && closeModal("resolve")}
						>
							<ResolveIncidentModal
								incidentId={selectedIncident._id}
								onResolve={handleResolveIncident}
								onClose={() => closeModal("resolve")}
							/>
						</Dialog.Root>
					)}
				</>
			)}

			{/* Delete Confirmation Modal */}
			<Dialog.Root
				open={modals.delete}
				onOpenChange={(open) => !open && closeModal("delete")}
			>
				<Dialog.Portal>
					<Dialog.Overlay className="fixed inset-0 bg-black/50" />
					<Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
						<Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
							Confirm Delete
						</Dialog.Title>
						<p className="text-gray-600 mb-6">
							Are you sure you want to delete this incident? This action cannot
							be undone.
						</p>
						<div className="flex justify-end gap-3">
							<button
								onClick={() => closeModal("delete")}
								className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={handleDeleteIncident}
								className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
							>
								Delete
							</button>
						</div>
					</Dialog.Content>
				</Dialog.Portal>
			</Dialog.Root>
		</div>
	);
};

export default IncidentAdminDashboard;
