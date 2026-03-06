// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { useEffect, useState } from 'react'
import { fetchChannels, type MessagingChannel } from '@/db/messagingChannels'
import { useWorkspace } from '@/hooks/useWorkspace'

export function useChannels() {
    const { workspace } = useWorkspace()
    const [channels, setChannels] = useState<MessagingChannel[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!workspace?.id) return
        setLoading(true)
        fetchChannels(workspace.id)
            .then((data) => setChannels(data.filter((c) => c.is_active)))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [workspace?.id])

    return { channels, loading }
}
