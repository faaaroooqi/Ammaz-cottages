import { useState, useEffect, useRef } from "react";
import { uploadRoomImages, deleteCloudinaryImage } from "../../services/admin.service";
import { showError } from "../../utils/toast";

const AMENITIES_LIST = ["WiFi", "AC", "TV", "Mini Fridge", "Balcony", "Ocean View", "Room Service"];

function RoomModal({ isOpen, onClose, onSave, roomData }) {
  const isEditing = !!roomData;
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    type: "Standard",
    pricePerNight: "",
    capacity: 2,
    description: "",
    facilities: [],
    status: "available",
    isActive: true
  });

  // Images already uploaded to Cloudinary (stored as URLs)
  const [existingImages, setExistingImages] = useState([]);
  // New files selected for upload (File objects with local preview)
  const [newFiles, setNewFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (roomData) {
      setFormData({
        name: roomData.name || "",
        type: roomData.type || "Standard",
        pricePerNight: roomData.pricePerNight || "",
        capacity: roomData.capacity || 2,
        description: roomData.description || "",
        facilities: roomData.facilities || [],
        status: roomData.status || "available",
        isActive: roomData.isActive !== undefined ? roomData.isActive : true
      });
      setExistingImages(roomData.images || []);
    } else {
      setFormData({
        name: "",
        type: "Standard",
        pricePerNight: "",
        capacity: 2,
        description: "",
        facilities: [],
        status: "available",
        isActive: true
      });
      setExistingImages([]);
    }
    setNewFiles([]);
    setUploadProgress("");
  }, [roomData, isOpen]);

  const totalImages = existingImages.length + newFiles.length;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleAmenityChange = (amenity) => {
    setFormData((prev) => {
      const isSelected = prev.facilities.includes(amenity);
      return {
        ...prev,
        facilities: isSelected
          ? prev.facilities.filter((a) => a !== amenity)
          : [...prev.facilities, amenity]
      };
    });
  };

  // ─── File Selection ──────────────────────────────────────────────
  const addFiles = (fileList) => {
    const files = Array.from(fileList);
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    const valid = files.filter((f) => allowed.includes(f.type) && f.size <= 5 * 1024 * 1024);

    if (valid.length < files.length) {
      showError("Some files were skipped. Only JPEG, PNG, WebP under 5 MB are accepted.");
    }

    const remaining = 5 - totalImages;
    const toAdd = valid.slice(0, remaining);

    if (toAdd.length < valid.length) {
      showError(`Only ${remaining} more image(s) can be added (max 5 total).`);
    }

    setNewFiles((prev) => [...prev, ...toAdd]);
  };

  const handleFileChange = (e) => {
    addFiles(e.target.files);
    // Reset the input so re-selecting the same file works
    e.target.value = "";
  };

  const removeNewFile = (index) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = async (url) => {
    // Extract public ID from Cloudinary URL and delete
    try {
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
      if (match) {
        await deleteCloudinaryImage(match[1]);
      }
    } catch {
      // Non-critical: image may already be deleted
    }
    setExistingImages((prev) => prev.filter((img) => img !== url));
  };

  // ─── Drag & Drop ─────────────────────────────────────────────────
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      addFiles(e.dataTransfer.files);
    }
  };

  // ─── Submit ──────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadProgress("Uploading images...");

    try {
      let allImageUrls = [...existingImages];

      // Upload new files if any
      if (newFiles.length > 0) {
        const fd = new FormData();
        newFiles.forEach((file) => fd.append("images", file));

        setUploadProgress(`Uploading ${newFiles.length} image(s) to cloud...`);
        const uploadRes = await uploadRoomImages(fd);

        const uploadedUrls = uploadRes.data.images.map((img) => img.url);
        allImageUrls = [...allImageUrls, ...uploadedUrls];
      }

      setUploadProgress("Saving room...");
      await onSave({
        ...formData,
        pricePerNight: Number(formData.pricePerNight),
        capacity: Number(formData.capacity),
        images: allImageUrls
      });
    } catch (error) {
      showError("Failed to upload images or save room.");
      console.error(error);
    } finally {
      setIsUploading(false);
      setUploadProgress("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto pt-6 pb-6">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl my-auto shadow-2xl border border-gray-100">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-bold text-gray-800">
            {isEditing ? "Edit Room" : "Add New Room"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl transition">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Row 1: Name & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Room Name</label>
              <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 focus:bg-white transition" placeholder="e.g. Deluxe Ocean View" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 focus:bg-white transition">
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          {/* Row 2: Type, Capacity, Price */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Type</label>
              <select name="type" value={formData.type} onChange={handleChange} className="w-full border border-gray-200 rounded-lg p-2.5 bg-gray-50 focus:bg-white transition">
                <option value="Standard">Standard</option>
                <option value="Deluxe">Deluxe</option>
                <option value="Suite">Suite</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Capacity</label>
              <input type="number" name="capacity" required min="1" value={formData.capacity} onChange={handleChange} className="w-full border border-gray-200 rounded-lg p-2.5 bg-gray-50 focus:bg-white transition" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Price/Night (PKR)</label>
              <input type="number" name="pricePerNight" required min="1" value={formData.pricePerNight} onChange={handleChange} className="w-full border border-gray-200 rounded-lg p-2.5 bg-gray-50 focus:bg-white transition" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} className="w-full border border-gray-200 rounded-lg p-2.5 bg-gray-50 focus:bg-white transition" rows="2" />
          </div>

          {/* Amenities */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Amenities</label>
            <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
              {AMENITIES_LIST.map((amenity) => (
                <label
                  key={amenity}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer text-sm font-medium border transition-all ${
                    formData.facilities.includes(amenity)
                      ? "bg-blue-100 text-blue-800 border-blue-300 shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:border-blue-200"
                  }`}
                >
                  <input 
                    type="checkbox" 
                    checked={formData.facilities.includes(amenity)}
                    onChange={() => handleAmenityChange(amenity)}
                    className="sr-only"
                  />
                  {formData.facilities.includes(amenity) && <span className="text-blue-600">✓</span>}
                  {amenity}
                </label>
              ))}
            </div>
          </div>

          {/* ── Image Upload Zone ──────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-gray-700">Room Images</label>
              <span className="text-xs text-gray-500 font-medium">{totalImages}/5 images</span>
            </div>

            {/* Existing + New Image Previews */}
            {(existingImages.length > 0 || newFiles.length > 0) && (
              <div className="grid grid-cols-5 gap-3 mb-3">
                {/* Existing (already on Cloudinary) */}
                {existingImages.map((url, idx) => (
                  <div key={`existing-${idx}`} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-green-200 shadow-sm">
                    <img src={url} alt={`Room ${idx + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => removeExistingImage(url)}
                        className="opacity-0 group-hover:opacity-100 bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold transition-all hover:bg-red-700 shadow-lg"
                        title="Remove image"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="absolute bottom-1 left-1 bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                      ☁️ Saved
                    </div>
                  </div>
                ))}

                {/* New files (local previews) */}
                {newFiles.map((file, idx) => (
                  <div key={`new-${idx}`} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-blue-200 border-dashed shadow-sm">
                    <img src={URL.createObjectURL(file)} alt={`New ${idx + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => removeNewFile(idx)}
                        className="opacity-0 group-hover:opacity-100 bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold transition-all hover:bg-red-700 shadow-lg"
                        title="Remove image"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="absolute bottom-1 left-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                      ⏳ New
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Drag & Drop Zone */}
            {totalImages < 5 && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-blue-500 bg-blue-50 scale-[1.01]"
                    : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="text-3xl mb-2">📸</div>
                <p className="text-sm font-semibold text-gray-700">
                  {isDragging ? "Drop images here!" : "Drag & drop images here, or click to browse"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  JPEG, PNG, WebP • Max 5 MB each • Up to {5 - totalImages} more
                </p>
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {uploadProgress && (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
              <span className="text-sm font-semibold text-blue-800">{uploadProgress}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-5 py-2.5 bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200 transition font-medium">
              Cancel
            </button>
            <button type="submit" disabled={isUploading} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-bold disabled:opacity-50 flex items-center gap-2">
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                "Save Room"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RoomModal;
