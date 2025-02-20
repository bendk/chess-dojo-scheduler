import {
    createContext,
    ReactNode,
    useContext,
    useState,
    useCallback,
    useEffect,
    useMemo,
} from 'react';

import { Request, useRequest } from '../Request';
import { useApi } from '../Api';
import { AuthStatus, useAuth } from '../../auth/Auth';
import { Requirement } from '../../database/requirement';
import { Event } from '../../database/event';
import { Notification } from '../../database/notification';
import { GetExplorerPositionResult } from '../explorerApi';

interface IdentifiableCache<T> {
    get: (id: string) => T | undefined;
    list: () => T[];
    filter: (predicate: (obj: T) => boolean) => T[];
    put: (obj: T) => void;
    putMany: (objs: T[]) => void;
    remove: (id: string) => void;
    isFetched: (id: string) => boolean;
    markFetched: (id: string) => void;
}

function useIdentifiableCache<T>(key?: string): IdentifiableCache<T> {
    const [objects, setObjects] = useState<Record<string, T>>({});
    const [fetchedIds, setFetchedIds] = useState<Record<string, boolean>>({});

    const get = useCallback(
        (id: string) => {
            return objects[id];
        },
        [objects]
    );

    const list = useCallback(() => Object.values(objects), [objects]);

    const filter = useCallback(
        (predicate: (obj: T) => boolean) => {
            return Object.values(objects).filter(predicate);
        },
        [objects]
    );

    const put = useCallback(
        (obj: T) => {
            const id = key ? (obj as any)[key] : (obj as any).id;
            setObjects((objects) => ({
                ...objects,
                [id]: obj,
            }));
        },
        [setObjects, key]
    );

    const putMany = useCallback(
        (objs: T[]) => {
            const newMap = objs.reduce((map: Record<string, T>, obj: T) => {
                const id = key ? (obj as any)[key] : (obj as any).id;
                map[id] = obj;
                return map;
            }, {});
            setObjects((objects) => ({
                ...objects,
                ...newMap,
            }));
        },
        [setObjects, key]
    );

    const remove = useCallback(
        (id: string) => {
            setObjects((objects) => {
                const { [id]: removed, ...others } = objects;
                return others;
            });
        },
        [setObjects]
    );

    const isFetched = useCallback(
        (id: string) => {
            return fetchedIds[id] || false;
        },
        [fetchedIds]
    );

    const markFetched = useCallback(
        (id: string) => {
            setFetchedIds((ids) => ({
                ...ids,
                [id]: true,
            }));
        },
        [setFetchedIds]
    );

    return {
        get,
        list,
        filter,
        put,
        putMany,
        remove,
        isFetched,
        markFetched,
    };
}

/**
 * CacheContextType defines the type of the cache as available through CacheProvider
 */
type CacheContextType = {
    isLoading: boolean;
    setIsLoading: (arg: boolean) => void;

    events: IdentifiableCache<Event>;
    requirements: IdentifiableCache<Requirement>;
    notifications: IdentifiableCache<Notification>;
    positions: IdentifiableCache<GetExplorerPositionResult>;

    imageBypass: number;
    setImageBypass: (v: number) => void;
};

const CacheContext = createContext<CacheContextType>(null!);

/**
 * @returns The current CacheContextType value.
 */
export function useCache() {
    return useContext(CacheContext);
}

/**
 * CacheProvider provides access to cached data. It implements the CacheContextType interface.
 * @param param0 React props. The only used prop is children.
 * @returns A CacheContext.Provider wrapping the provided children.
 */
export function CacheProvider({ children }: { children: ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);
    const events = useIdentifiableCache<Event>();
    const requirements = useIdentifiableCache<Requirement>();
    const notifications = useIdentifiableCache<Notification>();
    const positions = useIdentifiableCache<GetExplorerPositionResult>('normalizedFen');
    const [imageBypass, setImageBypass] = useState(Date.now());

    const value = {
        isLoading,
        setIsLoading,
        events,
        requirements,
        notifications,
        positions,
        imageBypass,
        setImageBypass,
    };
    return <CacheContext.Provider value={value}>{children}</CacheContext.Provider>;
}

interface UseEventsResponse {
    events: Event[];
    request: Request;
    putEvent: (e: Event) => void;
    removeEvent: (id: string) => void;
}

export function useEvents(): UseEventsResponse {
    const auth = useAuth();
    const api = useApi();
    const cache = useCache();
    const request = useRequest();

    const events = useMemo(() => cache.events.list(), [cache.events]);

    useEffect(() => {
        if (auth.status !== AuthStatus.Loading && !request.isSent()) {
            request.onStart();
            cache.setIsLoading(true);

            api.listEvents()
                .then((events) => {
                    request.onSuccess();
                    cache.events.putMany(events);
                })
                .catch((err) => {
                    console.error(err);
                    request.onFailure(err);
                })
                .finally(() => {
                    cache.setIsLoading(false);
                });
        }
    }, [auth.status, request, api, cache]);

    return {
        events,
        request,

        putEvent: cache.events.put,
        removeEvent: cache.events.remove,
    };
}

interface UseNotificationsResponse {
    notifications: Notification[];
    request: Request;
    removeNotification: (id: string) => void;
}

export function useNotifications(): UseNotificationsResponse {
    const auth = useAuth();
    const api = useApi();
    const cache = useCache();
    const request = useRequest();

    const notifications = useMemo(
        () => cache.notifications.list(),
        [cache.notifications]
    );

    useEffect(() => {
        if (auth.status === AuthStatus.Authenticated && !request.isSent()) {
            request.onStart();

            api.listNotifications()
                .then((resp) => {
                    request.onSuccess();
                    cache.notifications.putMany(resp.data.notifications);
                })
                .catch((err) => {
                    console.error(err);
                    request.onFailure(err);
                });
        }
    }, [auth.status, request, api, cache]);

    return {
        notifications,
        request,

        removeNotification: cache.notifications.remove,
    };
}
