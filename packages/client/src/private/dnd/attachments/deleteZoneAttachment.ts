import type { Attachment } from 'svelte/attachments'
import { get } from 'svelte/store'
import type { Writable } from 'svelte/store'
import type { ItemInZone, IDragState } from '../types'
import { isDraggingExistingItem } from '../state'
import type { WithId } from '../../../lib/entities/with-id'

interface DeleteZoneAttachmentOptions {
	dragStateStore: Writable<IDragState<WithId, ItemInZone<WithId>>>
	onHoverChange?: (hovered: boolean) => void
}

export function deleteZoneAttachment(options: DeleteZoneAttachmentOptions): Attachment {
	return (element: Element) => {
		const currentOptions = options

		function handleMouseEnter() {
			currentOptions.onHoverChange?.(true)
			const currentDragState = get(currentOptions.dragStateStore)
			if (isDraggingExistingItem(currentDragState)) {
				currentOptions.dragStateStore.update((state) => ({
					...state,
					targetType: 'delete-zone',
					targetZoneId: null,
					highlightedCell: null,
				}))
			}
		}

		function handleMouseLeave() {
			currentOptions.onHoverChange?.(false)
			const currentDragState = get(currentOptions.dragStateStore)
			if (isDraggingExistingItem(currentDragState)) {
				currentOptions.dragStateStore.update((state) => ({
					...state,
					targetType: null,
				}))
			}
		}

		element.addEventListener('mouseenter', handleMouseEnter)
		element.addEventListener('mouseleave', handleMouseLeave)

		return () => {
			element.removeEventListener('mouseenter', handleMouseEnter)
			element.removeEventListener('mouseleave', handleMouseLeave)
		}
	}
}
