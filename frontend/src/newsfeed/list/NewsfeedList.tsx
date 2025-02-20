import { Stack } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';

import { useApi } from '../../api/Api';
import { useRequest } from '../../api/Request';
import { ListNewsfeedResponse } from '../../api/newsfeedApi';
import LoadingPage from '../../loading/LoadingPage';
import { TimelineEntry } from '../../database/timeline';
import NewsfeedItem from '../detail/NewsfeedItem';
import LoadMoreButton from './LoadMoreButton';
import MultipleSelectChip from './MultipleSelectChip';

function useNewsfeedIds(initialNewsfeedIds: string[]): [string[], (v: string[]) => void] {
    let startingIds = initialNewsfeedIds.filter(
        (id) => (localStorage.getItem(`newsfeedId_${id}`) || 'true') === 'true'
    );
    if (startingIds.length === 0) {
        startingIds = initialNewsfeedIds;
    }

    const [newsfeedIds, setNewsfeedIds] = useState(startingIds);

    const onChange = useCallback(
        (newValue: string[]) => {
            setNewsfeedIds(newValue);

            console.log('New value: ', newValue);

            const removedIds = initialNewsfeedIds.filter(
                (id) => newValue.indexOf(id) === -1
            );

            console.log('Removed Ids: ', removedIds);
            for (const id of removedIds) {
                localStorage.setItem(`newsfeedId_${id}`, 'false');
            }

            for (const id of newValue) {
                localStorage.setItem(`newsfeedId_${id}`, 'true');
            }
        },
        [setNewsfeedIds, initialNewsfeedIds]
    );

    return [newsfeedIds, onChange];
}

const MAX_COMMENTS = 3;

interface NewsfeedListProps {
    initialNewsfeedIds: string[];
    newsfeedIdLabels?: Record<string, string>;
}

const NewsfeedList: React.FC<NewsfeedListProps> = ({
    initialNewsfeedIds,
    newsfeedIdLabels,
}) => {
    const api = useApi();
    const request = useRequest<ListNewsfeedResponse>();
    const [newsfeedIds, setNewsfeedIds] = useNewsfeedIds(initialNewsfeedIds);
    const [data, setData] = useState<ListNewsfeedResponse>();
    const [lastStartKey, setLastStartKey] = useState<Record<string, string>>({});

    const handleResponse = useCallback(
        (resp: ListNewsfeedResponse) => {
            setLastStartKey(data?.lastKeys || {});

            const seen: Record<string, boolean> = {};
            const newEntries = (data?.entries || [])
                .concat(
                    resp.entries.sort((lhs, rhs) =>
                        rhs.createdAt.localeCompare(lhs.createdAt)
                    )
                )
                .filter((e) => {
                    return seen.hasOwnProperty(e.id) ? false : (seen[e.id] = true);
                });

            setData({
                entries: newEntries,
                lastFetch: resp.lastFetch,
                lastKeys: resp.lastKeys,
            });
        },
        [setLastStartKey, data]
    );

    useEffect(() => {
        if (!request.isSent() && newsfeedIds.length > 0) {
            request.onStart();
            api.listNewsfeed(newsfeedIds)
                .then((resp) => {
                    console.log('listNewsfeed: ', resp);
                    handleResponse(resp.data);
                    request.onSuccess();
                })
                .catch((err) => {
                    console.error(err);
                    request.onFailure(err);
                });
        }
    }, [request, api, newsfeedIds, handleResponse]);

    const reset = request.reset;
    useEffect(() => {
        reset();
        setData(undefined);
        setLastStartKey({});
    }, [newsfeedIds, reset]);

    if ((newsfeedIds.length > 0 && !request.isSent()) || (request.isLoading() && !data)) {
        return <LoadingPage />;
    }

    const onEdit = (i: number, entry: TimelineEntry) => {
        const newData = data?.entries || [];
        setData({
            entries: [...newData.slice(0, i), entry, ...newData.slice(i + 1)],
            lastFetch: data?.lastFetch || '',
            lastKeys: data?.lastKeys || {},
        });
    };

    let skipLastFetch = true;
    let startKey = data?.lastKeys || {};
    if (data?.lastFetch && Object.values(data.lastKeys).length > 0) {
        skipLastFetch = false;
    } else if (data?.lastFetch) {
        startKey = lastStartKey;
    }

    const onLoadMore = () => {
        request.onStart();
        api.listNewsfeed(newsfeedIds, skipLastFetch, JSON.stringify(startKey))
            .then((resp) => {
                console.log('listNewsfeed: ', resp);
                handleResponse(resp.data);
                request.onSuccess();
            })
            .catch((err) => {
                console.error(err);
                request.onFailure(err);
            });
    };

    return (
        <Stack spacing={3}>
            {newsfeedIdLabels !== undefined && (
                <MultipleSelectChip
                    selected={newsfeedIds}
                    setSelected={setNewsfeedIds}
                    options={newsfeedIdLabels}
                    label='Show Posts From'
                />
            )}

            {data?.entries.map((entry, i) => (
                <NewsfeedItem
                    key={entry.id}
                    entry={entry}
                    onEdit={(e) => onEdit(i, e)}
                    maxComments={MAX_COMMENTS}
                />
            ))}

            <LoadMoreButton
                request={request}
                since={data?.lastFetch}
                startKey={startKey}
                onLoadMore={onLoadMore}
            />
        </Stack>
    );
};

export default NewsfeedList;
