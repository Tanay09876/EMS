import { Camera, Loader2, Pencil, Save, Trash2, User, X } from 'lucide-react';
import  { useRef, useState } from 'react'
import toast from 'react-hot-toast';
import api from '../api/axios';

const cropSize = 420;
const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];

const loadImage = (src) => new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
});

const cropImage = async ({src, zoom, offsetX, offsetY}) => {
    const image = await loadImage(src);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = cropSize;
    canvas.height = cropSize;
    const scale = Math.max(cropSize / image.width, cropSize / image.height) * zoom;

    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, cropSize, cropSize);
    ctx.save();
    ctx.translate(cropSize / 2, cropSize / 2);
    ctx.scale(scale, scale);
    ctx.drawImage(image, -image.width / 2 + offsetX / scale, -image.height / 2 + offsetY / scale);
    ctx.restore();

    return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(new File([blob], "profile-photo.webp", {type: "image/webp"})), "image/webp", 0.9);
    });
};

const ProfileForm = ({initialData, onSuccess}) => {
    const [loading, setLoading] = useState(false)
    const [photoLoading, setPhotoLoading] = useState(false)
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [imageSrc, setImageSrc] = useState("");
    const [previewUrl, setPreviewUrl] = useState(initialData.profileImage || "");
    const [zoom, setZoom] = useState(1);
    const [offsetX, setOffsetX] = useState(0);
    const [offsetY, setOffsetY] = useState(0);
    const fileInputRef = useRef(null);
    const dragRef = useRef({active: false, startX: 0, startY: 0, offsetX: 0, offsetY: 0});
    const initials = `${initialData.firstName?.[0] || ""}${initialData.lastName?.[0] || ""}`.toUpperCase();
    const setError = (text) => text && toast.error(text, {duration: 2500});
    const setMessage = (text) => text && toast.success(text, {duration: 2500});

    const resetCrop = () => {
        setZoom(1);
        setOffsetX(0);
        setOffsetY(0);
    };

    const startDrag = (e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        dragRef.current = {
            active: true,
            startX: e.clientX,
            startY: e.clientY,
            offsetX,
            offsetY,
        };
    };

    const moveDrag = (e) => {
        if(!dragRef.current.active) return;
        setOffsetX(dragRef.current.offsetX + e.clientX - dragRef.current.startX);
        setOffsetY(dragRef.current.offsetY + e.clientY - dragRef.current.startY);
    };

    const stopDrag = (e) => {
        if(e.currentTarget.hasPointerCapture?.(e.pointerId)){
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
        dragRef.current.active = false;
    };

    const closeEditModal = () => {
        if(imageSrc?.startsWith("blob:")) URL.revokeObjectURL(imageSrc);
        setImageSrc("");
        setShowEditModal(false);
        resetCrop();
    };

    const notifyProfileChange = (profileImage) => {
        window.dispatchEvent(new CustomEvent("profile-updated", {
            detail: {
                firstName: initialData.firstName,
                lastName: initialData.lastName,
                profileImage,
            }
        }));
    };

    const savePhoto = async ({file, remove = false}) => {
        if(!file && !remove){
            setError("Please choose a profile photo first.");
            return;
        }

        setPhotoLoading(true);
        const formData = new FormData();
        if(file) formData.append("profileImage", file);
        if(remove) formData.append("removeProfileImage", "true");

        try {
            const {data} = await api.post("/profile", formData);
            const nextImage = remove ? "" : data.profileImage;
            if(previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(nextImage || "");
            notifyProfileChange(nextImage || "");
            setMessage(remove ? "Profile photo removed" : "Profile photo updated");
            setShowPhotoModal(false);
            onSuccess?.();
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setPhotoLoading(false);
        }
    };

    const handleImageSelect = (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if(!file) return;
        if(!allowedImageTypes.includes(file.type)){
            setError("Please select a JPG, PNG, or WebP image.");
            return;
        }
        if(file.size > 8 * 1024 * 1024){
            setError("Please select an image smaller than 8MB.");
            return;
        }

        if(imageSrc?.startsWith("blob:")) URL.revokeObjectURL(imageSrc);
        setImageSrc(URL.createObjectURL(file));
        setShowEditModal(true);
        setMessage("");
        setError("");
        resetCrop();
    };

    const handleEditCurrentPhoto = () => {
        if(!previewUrl) return;
        setImageSrc(previewUrl);
        setShowEditModal(true);
        resetCrop();
    };

    const handleSaveCrop = async () => {
        if(!imageSrc){
            setError("Please choose a profile photo first.");
            return;
        }

        try {
            const file = await cropImage({src: imageSrc, zoom, offsetX, offsetY});
            await savePhoto({file});
            closeEditModal();
        } catch {
            setError("Could not edit this image. Please choose the photo again.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        const bio = formData.get("bio")?.toString() || "";
        if(bio.length > 500){
            setLoading(false);
            setError("Bio must be 500 characters or less.");
            return;
        }

        try {
            await api.post("/profile", formData)
            setMessage("Profile updated successfully")
            onSuccess?.()
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        }finally{
            setLoading(false)
        }
    }

  return (
    <>
    <form onSubmit={handleSubmit} className='card p-5 sm:p-6 mb-6'>
        <h2 className='text-base font-medium text-slate-900 mb-6 pb-4 border-b border-slate-100 flex items-center gap-2'>
           <User className="w-5 h-5 text-slate-400"/> Public Profile
        </h2>

        <div className='space-y-5'>
            <div className='flex flex-col items-center text-center'>
                <label className="block text-sm font-medium text-slate-700 mb-3">Profile Photo</label>
                <button type='button' disabled={initialData.isDeleted} onClick={() => setShowPhotoModal(true)} className='relative size-32 rounded-full border-[6px] border-blue-600 bg-indigo-50 overflow-visible flex items-center justify-center text-indigo-500 text-2xl font-medium disabled:opacity-60 disabled:cursor-not-allowed'>
                    {previewUrl ? <img src={previewUrl} alt="Profile" className='w-full h-full object-cover rounded-full'/> : initials || <User className='w-11 h-11 text-indigo-400'/>}
                    {!initialData.isDeleted && (
                        <span className='absolute right-0 bottom-1 size-10 rounded-full bg-blue-600 text-white flex items-center justify-center ring-4 ring-white'>
                            <Pencil className='w-5 h-5'/>
                        </span>
                    )}
                </button>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                    <input disabled value={`${initialData.firstName} ${initialData.lastName}`} className='bg-slate-50 text-slate-400 cursor-not-allowed'/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                    <input disabled value={initialData.email} className='bg-slate-50 text-slate-400 cursor-not-allowed"'/>
                </div>
                <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Position</label>
                    <input disabled value={initialData.position} className='bg-slate-50 text-slate-400 cursor-not-allowed"'/>
                </div>
            </div>
            <div>
                 <label className="block text-sm font-medium text-slate-700 mb-2">Bio</label>
                 <textarea disabled={initialData.isDeleted} name="bio"
                 defaultValue={initialData.bio || ""}
                 placeholder='Write a brief bio...'
                 className={`resize-none ${initialData.isDeleted ? "bg-slate-50 text-slate-400 cursor-not-allowed" : ""}`} />
                 <p className='text-xs text-slate-400 mt-1.5'>This will be displayed on your profile.</p>
            </div>
            {initialData.isDeleted ? (
                <div className='pt-2'>
                    <div className='p-4 bg-rose-50 border border-rose-200 rounded-xl text-center'>
                        <p className='text-rose-600 font-medium tracking-tight'>Account Deactivated</p>
                        <p className='text-sm text-rose-500 mt-0.5'>You can no longer update your profile.</p>
                    </div>
                </div>
            ) : (
                <div className='flex justify-end pt-2'>
                    <button type='submit' disabled={loading}
                    className='btn-primary flex items-center gap-2 justify-center w-full sm:w-auto'>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                        Save Changes
                    </button>
                </div>
            )}

        </div>

    </form>

    {showPhotoModal && (
        <div className='fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4'>
            <div className='bg-white rounded-md border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden'>
                <div className='flex items-center justify-between px-5 py-3 border-b border-slate-200'>
                    <h3 className='text-xl sm:text-2xl font-medium text-slate-900'>Profile Photo</h3>
                    <button type='button' onClick={() => setShowPhotoModal(false)} className='p-1.5 rounded-md border-2 border-slate-900 text-slate-900 hover:bg-slate-100'>
                        <X className='w-6 h-6'/>
                    </button>
                </div>
                <div className='p-5'>
                    <h4 className='text-xl sm:text-2xl font-semibold text-slate-950'>Upload a photo to add your profile</h4>
                    <p className='text-base sm:text-lg text-slate-600'>Upload a photo of yourself and then adjust it to your liking.</p>
                    <div className='flex justify-center py-8 sm:py-10'>
                        <div className='size-32 sm:size-36 rounded-full border-[6px] border-blue-600 bg-indigo-50 overflow-hidden flex items-center justify-center text-indigo-500 text-2xl font-medium'>
                            {previewUrl ? <img src={previewUrl} alt='Profile' className='w-full h-full object-cover'/> : initials || <User className='w-12 h-12 text-indigo-400'/>}
                        </div>
                    </div>
                    <input ref={fileInputRef} type='file' accept='image/png,image/jpeg,image/webp' onChange={handleImageSelect} className='file:mr-4 file:py-2 file:px-4 file:border-0 file:border-r file:border-blue-600 file:bg-slate-50 file:text-slate-700 border border-blue-600 rounded-md bg-white text-sm'/>
                </div>
                <div className='px-5 py-3 border-t border-slate-200 grid grid-cols-1 sm:flex sm:flex-wrap sm:justify-end gap-2'>
                    <button type='button' onClick={() => fileInputRef.current?.click()} disabled={photoLoading} className='btn-secondary inline-flex items-center gap-2 border-blue-600 text-blue-600'>
                        <Camera className='w-4 h-4'/>
                        Upload Photo
                    </button>
                    <button type='button' onClick={handleEditCurrentPhoto} disabled={!previewUrl || photoLoading} className='btn-secondary inline-flex items-center gap-2 border-blue-600 text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed'>
                        <Pencil className='w-4 h-4'/>
                        Edit Photo
                    </button>
                    <button type='button' onClick={() => savePhoto({remove: true})} disabled={!previewUrl || photoLoading} className='btn-secondary inline-flex items-center gap-2 border-blue-600 text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed'>
                        {photoLoading ? <Loader2 className='w-4 h-4 animate-spin'/> : <Trash2 className='w-4 h-4'/>}
                        Delete
                    </button>
                </div>
            </div>
        </div>
    )}

    {showEditModal && (
        <div className='fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-3 sm:p-4'>
            <div className='bg-white rounded-md shadow-2xl w-full max-w-xl overflow-hidden'>
                <div className='flex items-center justify-between px-4 sm:px-5 py-2.5'>
                    <h3 className='text-2xl sm:text-3xl font-medium text-slate-900'>Edit Photo</h3>
                    <button type='button' onClick={closeEditModal} className='p-1.5 rounded-md border-2 border-slate-900 text-slate-900 hover:bg-slate-100'>
                        <X className='w-6 h-6'/>
                    </button>
                </div>
                <div className='bg-black px-4 sm:px-5 py-3'>
                    <div
                        className='relative mx-auto aspect-square overflow-hidden bg-black cursor-grab active:cursor-grabbing touch-none select-none'
                        style={{width: "min(76vw, 38vh, 380px)"}}
                        onPointerDown={startDrag}
                        onPointerMove={moveDrag}
                        onPointerUp={stopDrag}
                        onPointerCancel={stopDrag}
                    >
                        <img
                            src={imageSrc}
                            alt='Edit profile'
                            draggable={false}
                            className='absolute left-1/2 top-1/2 h-full w-full object-cover select-none'
                            style={{transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) scale(${zoom})`}}
                        />
                        <div className='absolute inset-[10%] rounded-full border-2 border-white pointer-events-none'/>
                    </div>
                    <div className='mt-3 rounded-md bg-white/5 px-2 py-2'>
                        <div className='flex items-center justify-between text-xs text-white/80 mb-1.5'>
                            <span>Drag photo to position</span>
                            <span>{Math.round(zoom * 100)}%</span>
                        </div>
                        <input type='range' aria-label='Zoom photo' min='1' max='3' step='0.05' value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className='accent-blue-600 p-0 border-0 bg-transparent h-4'/>
                    </div>
                </div>
                <div className='p-3 grid grid-cols-3 gap-2 sm:gap-3'>
                    <button type='button' onClick={resetCrop} disabled={photoLoading} className='btn-primary text-sm sm:text-base px-2'>Fit to width</button>
                    <button type='button' onClick={handleSaveCrop} disabled={photoLoading} className='btn-primary text-sm sm:text-base px-2'>
                        {photoLoading ? <Loader2 className='w-5 h-5 animate-spin mx-auto'/> : "Save"}
                    </button>
                    <button type='button' onClick={closeEditModal} disabled={photoLoading} className='btn-primary text-sm sm:text-base px-2'>Cancel</button>
                </div>
            </div>
        </div>
    )}
    </>
  )
}

export default ProfileForm
