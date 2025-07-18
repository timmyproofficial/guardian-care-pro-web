import React, { memo, useMemo, useState, useRef, useEffect } from "react";
import {
	ArrowLeft,
	Save,
	Upload,
	FileText,
	X,
	Search,
	Bold,
	Italic,
	Underline,
	List,
	ListOrdered,
	Link,
	Quote,
	Undo,
	Redo,
	Eye,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import shiftService from "@/api/services/shiftService";
import { ShiftStatus } from "@/entities/Shift";
import incidentService from "@/api/services/incidentService";
import { toast } from "sonner";
import { CreateIncidentDTO } from "@/types/incidents.types";

interface Shift {
	_id: string;
	shiftId: string;
	participantId: {
		firstName: string;
		lastName: string;
	};
	serviceTypeId: {
		name: string;
	};
	startTime: string;
	endTime: string;
	status: ShiftStatus;
}

interface FormData {
	title: string;
	description: string;
	severity: string;
	shiftId: string;
	urlLinks: string[];
	// tags: string[];
}

const CreateIncidentPage = () => {
	const queryClient = useQueryClient();
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const [formData, setFormData] = useState<FormData>({
		title: "",
		description: "",
		severity: "",
		shiftId: "",
		urlLinks: [],
		// tags: [],
	});

	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
	const [showShiftModal, setShowShiftModal] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showSuccess, setShowSuccess] = useState(false);
	const [showPreview, setShowPreview] = useState(false);
	// const [currentTag, setCurrentTag] = useState("");

	const {
		data: shifts,
		isLoading: isShiftsLoading,
		error: shiftsError,
	} = useQuery({
		queryKey: ["shifts"],
		queryFn: () => shiftService.getShifts(),
	});

	// Mutation for creating incident
	const createIncidentMutation = useMutation({
		mutationFn: (data: FormData) => {
			setIsSubmitting(true);
			return incidentService.createIncident(data as CreateIncidentDTO);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["incidents"] });
			setShowSuccess(true);
			clearForm();
			toast.success("Incident created successfully");
		},
		onError: (error) => {
			toast.error("Failed to create incident");
			console.error("Error creating incident:", error);
			setIsSubmitting(false);
		},
		onSettled: () => {
			setIsSubmitting(false);
		},
	});

	const handleInputChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			const files = Array.from(e.target.files);
			setSelectedFiles((prev) => [...prev, ...files]);
			setFormData((prev) => ({
				...prev,
				urlLinks: [...prev.urlLinks, ...files.map((file) => file.name)],
			}));
		}
	};

	const removeFile = (index: number) => {
		setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
		setFormData((prev) => ({
			...prev,
			urlLinks: prev.urlLinks.filter((_, i) => i !== index),
		}));
	};

	const handleShiftSelect = (shift: Shift) => {
		setSelectedShift(shift);
		setFormData((prev) => ({
			...prev,
			shiftId: shift.shiftId,
		}));
		setShowShiftModal(false);
	};

	// const addTag = (e: React.FormEvent) => {
	//   e.preventDefault();
	//   if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
	//     setFormData((prev) => ({
	//       ...prev,
	//       tags: [...prev.tags, currentTag.trim()],
	//     }));
	//     setCurrentTag("");
	//   }
	// };

	// const removeTag = (tagToRemove: string) => {
	//   setFormData((prev) => ({
	//     ...prev,
	//     tags: prev.tags.filter((tag) => tag !== tagToRemove),
	//   }));
	// };

	const clearForm = () => {
		setFormData({
			title: "",
			description: "",
			severity: "",
			shiftId: "",
			urlLinks: [],
			// tags: [],
		});
		setSelectedFiles([]);
		setSelectedShift(null);
		// setCurrentTag("");
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		createIncidentMutation.mutate(formData);
	};

	const filteredShifts = useMemo(() => {
		if (!shifts) return [];
		return shifts.filter((shift: Shift) => {
			const searchLower = searchTerm.toLowerCase();
			const participant = shift.participantId;
			const firstName =
				typeof participant === "object" && participant !== null
					? participant.firstName.toLowerCase()
					: "";
			const lastName =
				typeof participant === "object" && participant !== null
					? participant.lastName.toLowerCase()
					: "";

			return (
				shift.shiftId.toLowerCase().includes(searchLower) ||
				firstName.includes(searchLower) ||
				lastName.includes(searchLower) ||
				shift.serviceTypeId.name.toLowerCase().includes(searchLower)
			);
		});
	}, [shifts, searchTerm]);

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const applyFormatting = (format: string) => {
		if (!textareaRef.current) return;

		const textarea = textareaRef.current;
		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const selectedText = formData.description.substring(start, end);
		let newText = formData.description;

		switch (format) {
			case "bold":
				newText = `${formData.description.substring(
					0,
					start
				)}**${selectedText}**${formData.description.substring(end)}`;
				break;
			case "italic":
				newText = `${formData.description.substring(
					0,
					start
				)}_${selectedText}_${formData.description.substring(end)}`;
				break;
			case "underline":
				newText = `${formData.description.substring(
					0,
					start
				)}<u>${selectedText}</u>${formData.description.substring(end)}`;
				break;
			case "list":
				newText = `${formData.description.substring(
					0,
					start
				)}- ${selectedText}\n${formData.description.substring(end)}`;
				break;
			case "orderedList":
				newText = `${formData.description.substring(
					0,
					start
				)}1. ${selectedText}\n${formData.description.substring(end)}`;
				break;
			case "quote":
				newText = `${formData.description.substring(
					0,
					start
				)}> ${selectedText}\n${formData.description.substring(end)}`;
				break;
			case "link":
				const url = prompt("Enter URL:");
				if (url) {
					newText = `${formData.description.substring(
						0,
						start
					)}[${selectedText}](${url})${formData.description.substring(end)}`;
				}
				break;
			default:
				break;
		}

		setFormData((prev) => ({ ...prev, description: newText }));

		// Restore cursor position
		setTimeout(() => {
			if (textareaRef.current) {
				textareaRef.current.selectionStart = start;
				textareaRef.current.selectionEnd = end;
				textareaRef.current.focus();
			}
		}, 0);
	};

	const renderPreview = () => {
		// Simple markdown rendering for preview
		let html = formData.description
			.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
			.replace(/\_(.*?)\_/g, "<em>$1</em>")
			.replace(/<u>(.*?)<\/u>/g, "<u>$1</u>")
			.replace(/\n/g, "<br>")
			.replace(/> (.*?)\n/g, "<blockquote>$1</blockquote>")
			.replace(/- (.*?)\n/g, "<li>$1</li>")
			.replace(/1\. (.*?)\n/g, "<li>$1</li>")
			.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');

		// Handle line breaks for lists
		html = html.replace(/<li>(.*?)<br>/g, "<li>$1</li>");

		return { __html: html };
	};

	// Go back to history when submission
	useEffect(() => {
		if (showSuccess) {
			const interval = setTimeout(() => {
				window.history.back();
			}, 1500);

			return () => clearTimeout(interval);
		}
	}, [showSuccess]);

	if (showSuccess) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full mx-4">
					<div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg
							className="w-8 h-8 text-green-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M5 13l4 4L19 7"
							/>
						</svg>
					</div>
					<h2 className="text-2xl font-bold text-gray-900 mb-2">
						Incident Created Successfully!
					</h2>
					<p className="text-gray-600 mb-4">
						Your incident has been submitted and is now being processed.
					</p>
					<div className="text-sm text-gray-500">
						Redirecting in a moment...
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen w-full bg-gray-50">
			<div className=" mx-4 p-6">
				{/* Header */}
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
					<div className="px-6 py-4 border-b border-gray-200">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div>
									<h1 className="text-2xl font-bold text-gray-900">
										Create New Incident
									</h1>
									<p className="text-gray-600">
										Report and document incident details
									</p>
								</div>
							</div>
							<div className="flex items-center gap-3">
								<button
									type="button"
									onClick={clearForm}
									className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
								>
									Clear Form
								</button>
								<button
									type="button"
									onClick={() => setShowPreview(true)}
									className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
								>
									<Eye size={16} />
									Preview
								</button>
								<button
									type="submit"
									form="incident-form"
									disabled={isSubmitting}
									className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
								>
									{isSubmitting ? (
										<>
											<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
											Submitting...
										</>
									) : (
										<>
											<Save size={16} />
											Submit Incident
										</>
									)}
								</button>
							</div>
						</div>
					</div>
				</div>

				<form id="incident-form" onSubmit={handleSubmit} className="space-y-6">
					{/* Basic Information */}
					<div className="bg-white rounded-lg shadow-sm border border-gray-200">
						<div className="px-6 py-4 border-b border-gray-200">
							<h2 className="text-lg font-semibold text-gray-900">
								Basic Information
							</h2>
						</div>
						<div className="p-6 space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Incident Title *
								</label>
								<input
									type="text"
									name="title"
									required
									value={formData.title}
									onChange={handleInputChange}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									placeholder="Brief summary of the incident"
								/>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Severity Level *
									</label>
									<select
										name="severity"
										required
										value={formData.severity}
										onChange={handleInputChange}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									>
										<option value="">Select severity</option>
										<option value="LOW">Low</option>
										<option value="MEDIUM">Medium</option>
										<option value="HIGH">High</option>
									</select>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Related Shift *
									</label>
									<div className="flex gap-2">
										<input
											type="text"
											value={formData.shiftId}
											readOnly
											className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
											placeholder="No shift selected"
										/>
										<button
											type="button"
											onClick={() => setShowShiftModal(true)}
											className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
										>
											Select Shift
										</button>
									</div>
									{selectedShift && (
										<div className="mt-2 p-3 bg-blue-50 rounded-lg">
											<div className="text-sm">
												<p className="font-medium text-gray-900">
													{selectedShift.participantId.firstName}{" "}
													{selectedShift.participantId.lastName}
												</p>
												<p className="text-gray-600">
													{selectedShift.serviceTypeId.name}
												</p>
												<p className="text-gray-500 text-xs">
													{formatDate(selectedShift.startTime)} -{" "}
													{formatDate(selectedShift.endTime)}
												</p>
											</div>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>

					{/* Description with Editor */}
					<div className="bg-white rounded-lg shadow-sm border border-gray-200">
						<div className="px-6 py-4 border-b border-gray-200">
							<h2 className="text-lg font-semibold text-gray-900">
								Incident Description
							</h2>
						</div>
						<div className="border border-gray-300 rounded-lg m-6">
							<EditorToolbar applyFormatting={applyFormatting} />
							<textarea
								ref={textareaRef}
								name="description"
								required
								value={formData.description}
								onChange={handleInputChange}
								rows={8}
								className="w-full px-4 py-3 border-0 rounded-b-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
								placeholder="Provide a detailed description of the incident. Include what happened, when it occurred, who was involved, and any relevant circumstances..."
							/>
						</div>
					</div>

					{/* Tags */}
					{/* <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Tags</h2>
            </div>
            <div className="p-6">
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addTag(e)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add tags (e.g., security, equipment, emergency)"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Add Tag
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-blue-600"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div> */}

					{/* File Attachments */}
					<div className="bg-white rounded-lg shadow-sm border border-gray-200">
						<div className="px-6 py-4 border-b border-gray-200">
							<h2 className="text-lg font-semibold text-gray-900">
								Evidence & Attachments
							</h2>
						</div>
						<div className="p-6">
							<div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
								<Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
								<div className="text-sm text-gray-600 mb-2">
									<label className="cursor-pointer text-blue-600 hover:text-blue-500">
										Click to upload files
										<input
											type="file"
											multiple
											className="hidden"
											onChange={handleFileUpload}
											accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.mp4,.mov"
										/>
									</label>{" "}
									or drag and drop
								</div>
								<p className="text-xs text-gray-500">
									PDF, DOC, images, videos up to 10MB each
								</p>
							</div>

							{selectedFiles.length > 0 && (
								<div className="mt-4 space-y-2">
									<h3 className="text-sm font-medium text-gray-700">
										Attached Files:
									</h3>
									{selectedFiles.map((file, index) => (
										<div
											key={index}
											className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
										>
											<div className="flex items-center gap-3">
												<FileText className="h-5 w-5 text-gray-400" />
												<div>
													<p className="text-sm font-medium text-gray-900">
														{file.name}
													</p>
													<p className="text-xs text-gray-500">
														{(file.size / 1024).toFixed(1)} KB
													</p>
												</div>
											</div>
											<button
												type="button"
												onClick={() => removeFile(index)}
												className="text-red-600 hover:text-red-800"
											>
												<X size={16} />
											</button>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</form>
			</div>

			{/* Shift Selection Modal */}
			{showShiftModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto m-4">
						<div className="flex items-center justify-between p-6 border-b border-gray-200">
							<h2 className="text-xl font-semibold text-gray-900">
								Select Shift
							</h2>
							<button
								onClick={() => setShowShiftModal(false)}
								className="text-gray-400 hover:text-gray-600"
							>
								<X size={24} />
							</button>
						</div>

						<div className="p-6">
							<div className="mb-4">
								<div className="relative">
									<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
									<input
										type="text"
										placeholder="Search shifts..."
										className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
									/>
								</div>
							</div>

							<div className="space-y-3">
								{filteredShifts.map((shift: Shift) => (
									<div
										key={shift._id}
										className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
											formData.shiftId === shift.shiftId
												? "border-blue-500 bg-blue-50"
												: "border-gray-200"
										}`}
										onClick={() => handleShiftSelect(shift)}
									>
										<div className="flex justify-between items-start">
											<div>
												<h3 className="font-medium text-gray-900">
													{shift.participantId.firstName}{" "}
													{shift.participantId.lastName}
												</h3>
												<p className="text-sm text-gray-600">
													{shift.serviceTypeId.name}
												</p>
											</div>
											<span
												className={`px-2 py-1 text-xs rounded-full ${
													shift.status === "completed"
														? "bg-green-100 text-green-800"
														: shift.status === ShiftStatus.OPEN
														? "bg-blue-100 text-blue-800"
														: "bg-gray-100 text-gray-800"
												}`}
											>
												{shift.status}
											</span>
										</div>
										<div className="mt-2 text-sm text-gray-600">
											<p>
												<span className="font-medium">ID:</span> {shift.shiftId}
											</p>
											<p>
												<span className="font-medium">Time:</span>{" "}
												{formatDate(shift.startTime)} -{" "}
												{formatDate(shift.endTime)}
											</p>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Preview Modal */}
			{showPreview && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg  w-full max-h-[90vh] overflow-y-auto m-4">
						<div className="flex items-center justify-between p-6 border-b border-gray-200">
							<h2 className="text-xl font-semibold text-gray-900">
								Incident Preview
							</h2>
							<button
								onClick={() => setShowPreview(false)}
								className="text-gray-400 hover:text-gray-600"
							>
								<X size={24} />
							</button>
						</div>

						<div className="p-6 space-y-6">
							<div>
								<h3 className="text-lg font-medium text-gray-900 mb-2">
									Title
								</h3>
								<p className="text-gray-800">{formData.title}</p>
							</div>

							<div>
								<h3 className="text-lg font-medium text-gray-900 mb-2">
									Severity
								</h3>
								<p className="text-gray-800 capitalize">
									{formData.severity.toLowerCase()}
								</p>
							</div>

							{selectedShift && (
								<div>
									<h3 className="text-lg font-medium text-gray-900 mb-2">
										Related Shift
									</h3>
									<div className="p-3 bg-blue-50 rounded-lg">
										<div className="text-sm">
											<p className="font-medium text-gray-900">
												{selectedShift.participantId.firstName}{" "}
												{selectedShift.participantId.lastName}
											</p>
											<p className="text-gray-600">
												{selectedShift.serviceTypeId.name}
											</p>
											<p className="text-gray-500 text-xs">
												{formatDate(selectedShift.startTime)} -{" "}
												{formatDate(selectedShift.endTime)}
											</p>
										</div>
									</div>
								</div>
							)}

							<div>
								<h3 className="text-lg font-medium text-gray-900 mb-2">
									Description
								</h3>
								<div
									className="prose max-w-none p-4 border border-gray-200 rounded-lg"
									dangerouslySetInnerHTML={renderPreview()}
								/>
							</div>

							{/* {formData.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )} */}

							{selectedFiles.length > 0 && (
								<div>
									<h3 className="text-lg font-medium text-gray-900 mb-2">
										Attachments
									</h3>
									<div className="space-y-2">
										{selectedFiles.map((file, index) => (
											<div
												key={index}
												className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
											>
												<div className="flex items-center gap-3">
													<FileText className="h-5 w-5 text-gray-400" />
													<div>
														<p className="text-sm font-medium text-gray-900">
															{file.name}
														</p>
														<p className="text-xs text-gray-500">
															{(file.size / 1024).toFixed(1)} KB
														</p>
													</div>
												</div>
											</div>
										))}
									</div>
								</div>
							)}

							<div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
								<button
									type="button"
									onClick={() => setShowPreview(false)}
									className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
								>
									Back to Editing
								</button>
								<button
									type="button"
									onClick={() => {
										setShowPreview(false);
										document
											.getElementById("incident-form")
											?.dispatchEvent(
												new Event("submit", { cancelable: true, bubbles: true })
											);
									}}
									className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
								>
									Confirm Submission
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

interface EditorToolbarProps {
	applyFormatting: (format: string) => void;
}

const EditorToolbar = memo(({ applyFormatting }: EditorToolbarProps) => {
	const handleButtonClick = (e: React.MouseEvent, format: string) => {
		e.preventDefault();
		applyFormatting(format);
	};

	return (
		<div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
			<button
				className="p-1.5 hover:bg-gray-200 rounded"
				title="Bold"
				onClick={(e) => handleButtonClick(e, "bold")}
			>
				<Bold size={16} />
			</button>
			<button
				className="p-1.5 hover:bg-gray-200 rounded"
				title="Italic"
				onClick={(e) => handleButtonClick(e, "italic")}
			>
				<Italic size={16} />
			</button>
			<button
				className="p-1.5 hover:bg-gray-200 rounded"
				title="Underline"
				onClick={(e) => handleButtonClick(e, "underline")}
			>
				<Underline size={16} />
			</button>
			<div className="w-px h-4 bg-gray-300 mx-1"></div>
			<button
				className="p-1.5 hover:bg-gray-200 rounded"
				title="Bullet List"
				onClick={(e) => handleButtonClick(e, "list")}
			>
				<List size={16} />
			</button>
			<button
				className="p-1.5 hover:bg-gray-200 rounded"
				title="Numbered List"
				onClick={(e) => handleButtonClick(e, "orderedList")}
			>
				<ListOrdered size={16} />
			</button>
			<button
				className="p-1.5 hover:bg-gray-200 rounded"
				title="Quote"
				onClick={(e) => handleButtonClick(e, "quote")}
			>
				<Quote size={16} />
			</button>
			<div className="w-px h-4 bg-gray-300 mx-1"></div>
			<button
				className="p-1.5 hover:bg-gray-200 rounded"
				title="Add Link"
				onClick={(e) => handleButtonClick(e, "link")}
			>
				<Link size={16} />
			</button>
			<div className="w-px h-4 bg-gray-300 mx-1"></div>
			<button
				className="p-1.5 hover:bg-gray-200 rounded"
				title="Undo"
				onClick={(e) => handleButtonClick(e, "undo")}
			>
				<Undo size={16} />
			</button>
			<button
				className="p-1.5 hover:bg-gray-200 rounded"
				title="Redo"
				onClick={(e) => handleButtonClick(e, "redo")}
			>
				<Redo size={16} />
			</button>
		</div>
	);
});

export default CreateIncidentPage;
