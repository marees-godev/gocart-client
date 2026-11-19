'use client'

import { Star, XIcon, Loader2, CheckCircle2 } from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { graphqlRequest } from '@/lib/apiClient';
import { CREATE_RATING_MUTATION } from '@/lib/graphql/rating';
import { addRating } from '@/lib/features/rating/ratingSlice';

const RatingModal = ({ ratingModal, setRatingModal, onRatingSuccess }) => {
    const [rating, setRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(0);
    const [review, setReview] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const dispatch = useDispatch();

    const handleSubmit = async (e) => {
        e?.preventDefault();

        if (rating < 1 || rating > 5) {
            toast.error('Please select a rating between 1 and 5 stars');
            return;
        }

        if (!review.trim()) {
            toast.error('Please write a brief review');
            return;
        }

        setIsSubmitting(true);
        const loadingToast = toast.loading('Submitting your review...');

        try {
            const input = {
                orderId: String(ratingModal.orderId),
                orderItemId: String(ratingModal.orderItemId || ''),
                productId: String(ratingModal.productId),
                rating: Number(rating),
                review: review.trim(),
            };

            const res = await graphqlRequest(CREATE_RATING_MUTATION, { input });
            toast.dismiss(loadingToast);

            if (res?.createRating) {
                const created = res.createRating;
                toast.success('Thank you! Your rating has been submitted.');

                dispatch(addRating({
                    id: created.id,
                    orderId: ratingModal.orderId,
                    orderItemId: ratingModal.orderItemId,
                    productId: ratingModal.productId,
                    rating: created.rating,
                    review: created.review,
                    createdAt: created.createdAt,
                }));

                if (onRatingSuccess) {
                    onRatingSuccess(created);
                }

                setRatingModal(null);
            } else {
                throw new Error('Rating submission failed');
            }
        } catch (err) {
            toast.dismiss(loadingToast);
            console.error('Rating submission error:', err);
            toast.error(err.message || 'Could not submit review. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150'>
            <div className='bg-white p-6 sm:p-7 rounded-2xl shadow-2xl w-full max-w-md relative border border-slate-100'>
                <button
                    type="button"
                    onClick={() => setRatingModal(null)}
                    className='absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer'
                >
                    <XIcon size={18} />
                </button>

                <div className='mb-4'>
                    <h2 className='text-lg font-bold text-slate-800'>Rate & Review</h2>
                    <p className='text-xs text-slate-500 mt-0.5 truncate'>
                        {ratingModal.productName ? `Sharing feedback for "${ratingModal.productName}"` : 'Share your verified purchase experience'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className='space-y-4'>
                    {/* Interactive Star Picker */}
                    <div className='flex flex-col items-center justify-center p-3.5 bg-slate-50 rounded-xl border border-slate-100'>
                        <div className='flex items-center gap-2'>
                            {[1, 2, 3, 4, 5].map((starNum) => {
                                const activeStar = (hoverRating || rating) >= starNum;
                                return (
                                    <button
                                        key={starNum}
                                        type="button"
                                        onMouseEnter={() => setHoverRating(starNum)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        onClick={() => setRating(starNum)}
                                        className='p-1 transition-transform hover:scale-110 active:scale-95 cursor-pointer'
                                    >
                                        <Star
                                            size={28}
                                            className={`${activeStar ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`}
                                        />
                                    </button>
                                );
                            })}
                        </div>
                        <span className='text-xs font-semibold text-slate-600 mt-2'>
                            {hoverRating || rating} out of 5 stars
                        </span>
                    </div>

                    {/* Review text */}
                    <div>
                        <label className='block text-xs font-semibold text-slate-700 mb-1.5'>
                            Your Review
                        </label>
                        <textarea
                            className='w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30 transition placeholder:text-slate-400'
                            placeholder='What did you like or dislike? How was the quality?'
                            rows='4'
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className='flex gap-2 pt-1'>
                        <button
                            type="button"
                            onClick={() => setRatingModal(null)}
                            disabled={isSubmitting}
                            className='flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer'
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className='flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-green-600 hover:bg-green-700 active:scale-98 text-white text-xs font-semibold shadow-md shadow-green-600/20 transition cursor-pointer disabled:opacity-60'
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={14} className='animate-spin' /> Submitting...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={14} /> Submit Review
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RatingModal;
