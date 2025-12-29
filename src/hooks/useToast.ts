/**
 * Re-export useToast hook from ToastProvider
 * This file provides a convenient import path for the toast hook
 *
 * @module hooks/useToast
 *
 * @example
 * ```tsx
 * import { useToast } from '@/hooks/useToast';
 *
 * function MyComponent() {
 *   const { success, error, warning, info } = useToast();
 *
 *   const handleAction = async () => {
 *     try {
 *       await performAction();
 *       success('Success!', 'Action completed successfully.');
 *     } catch (e) {
 *       error('Error', 'Action failed. Please try again.');
 *     }
 *   };
 *
 *   return <button onClick={handleAction}>Perform Action</button>;
 * }
 * ```
 */
export { useToast } from '@/components/ui/ToastProvider';
