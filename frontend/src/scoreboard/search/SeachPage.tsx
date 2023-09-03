import {
    Checkbox,
    Container,
    FormControl,
    FormControlLabel,
    FormHelperText,
    Link,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useState } from 'react';
import { LoadingButton } from '@mui/lab';

import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { RatingSystem, User, dojoCohorts } from '../../database/user';
import {
    DataGrid,
    GridColDef,
    GridRenderCellParams,
    GridValueGetterParams,
} from '@mui/x-data-grid';

const AllColumns: GridColDef[] = [
    {
        field: 'dojoCohort',
        headerName: 'Cohort',
        valueGetter: (params: GridValueGetterParams<User, any>) => params.row.dojoCohort,
        minWidth: 125,
    },
    {
        field: 'display',
        headerName: 'Display Name',
        valueGetter: (params: GridValueGetterParams<User, any>) => params.row.displayName,
        renderCell: (params: GridRenderCellParams<User, string>) => {
            return (
                <Link component={RouterLink} to={`/profile/${params.row.username}`}>
                    {params.value}
                </Link>
            );
        },
        flex: 1,
    },
    {
        field: 'discord',
        headerName: 'Discord Username',
        valueGetter: (params: GridValueGetterParams<User, any>) =>
            params.row.discordUsername,
        flex: 1,
    },
    {
        field: RatingSystem.Chesscom,
        headerName: 'Chess.com Username',
        valueGetter: (params: GridValueGetterParams<User, any>) =>
            params.row.ratings[RatingSystem.Chesscom]?.username,
        flex: 1,
        minWidth: 175,
    },
    {
        field: RatingSystem.Lichess,
        headerName: 'Lichess Username',
        valueGetter: (params: GridValueGetterParams<User, any>) =>
            params.row.ratings[RatingSystem.Lichess]?.username,
        flex: 1,
    },
    {
        field: RatingSystem.Fide,
        headerName: 'FIDE ID',
        valueGetter: (params: GridValueGetterParams<User, any>) =>
            params.row.ratings[RatingSystem.Fide]?.username,
        flex: 1,
    },
    {
        field: RatingSystem.Uscf,
        headerName: 'USCF ID',
        valueGetter: (params: GridValueGetterParams<User, any>) =>
            params.row.ratings[RatingSystem.Uscf]?.username,
        flex: 1,
    },
    {
        field: RatingSystem.Cfc,
        headerName: 'CFC ID',
        valueGetter: (params: GridValueGetterParams<User, any>) =>
            params.row.ratings[RatingSystem.Cfc]?.username,
        flex: 1,
    },
    {
        field: RatingSystem.Ecf,
        headerName: 'ECF ID',
        valueGetter: (params: GridValueGetterParams<User, any>) =>
            params.row.ratings[RatingSystem.Ecf]?.username,
        flex: 1,
    },
    {
        field: RatingSystem.Dwz,
        headerName: 'DWZ ID',
        valueGetter: (params: GridValueGetterParams<User, any>) =>
            params.row.ratings[RatingSystem.Dwz]?.username,
        flex: 1,
    },
];

const SearchFields = ['display', 'discord', ...Object.values(RatingSystem)];

function getDisplayString(field: string): string {
    switch (field) {
        case 'display':
            return 'Display Name';
        case 'discord':
            return 'Discord Username';
        case RatingSystem.Chesscom:
            return 'Chess.com Username';
        case RatingSystem.Lichess:
            return 'Lichess Username';
        case RatingSystem.Fide:
            return 'FIDE ID';
        case RatingSystem.Uscf:
            return 'USCF ID';
        case RatingSystem.Cfc:
            return 'CFC ID';
        case RatingSystem.Ecf:
            return 'ECF ID';
        case RatingSystem.Dwz:
            return 'DWZ ID';
    }
    return '';
}

const SearchPage = () => {
    const navigate = useNavigate();
    const api = useApi();
    const request = useRequest<User[]>();

    const [query, setQuery] = useState('');
    const [allFields, setAllFields] = useState(true);
    const [fields, setFields] = useState<Record<string, boolean>>(
        SearchFields.reduce((map, field) => {
            map[field] = false;
            return map;
        }, {} as Record<string, boolean>)
    );
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [columns, setColumns] = useState(AllColumns);

    const onChangeField = (field: string, value: boolean) => {
        setFields({
            ...fields,
            [field]: value,
        });
    };

    const onChangeView = (view: string) => {
        navigate(`../${view}`);
    };

    const onSearch = () => {
        const newErrors: Record<string, string> = {};
        if (query.trim() === '') {
            newErrors.query = 'This field is required';
        }
        const selectedFields = allFields
            ? ['all']
            : Object.keys(fields).filter((f) => fields[f]);
        if (selectedFields.length === 0) {
            newErrors.fields = 'At least one search field is required';
        }

        setErrors(newErrors);
        if (Object.entries(newErrors).length > 0) {
            return;
        }

        request.onStart();

        if (allFields) {
            setColumns(AllColumns);
        } else {
            setColumns(AllColumns.filter((c, i) => i <= 1 || fields[c.field]));
        }

        api.searchUsers(query.trim(), selectedFields)
            .then((resp) => {
                console.log('searchUsers: ', resp);
                request.onSuccess(resp);
            })
            .catch((err) => {
                console.error(err);
                request.onFailure(err);
            });
    };

    return (
        <Container maxWidth='xl' sx={{ pt: 4, pb: 4 }}>
            <RequestSnackbar request={request} />

            <Stack spacing={4}>
                <TextField
                    select
                    label='View'
                    value='search'
                    onChange={(event) => onChangeView(event.target.value)}
                    sx={{ mb: 3 }}
                    fullWidth
                >
                    <MenuItem value='search'>User Search</MenuItem>
                    <MenuItem value='stats'>Statistics</MenuItem>
                    {dojoCohorts.map((option) => (
                        <MenuItem key={option} value={option}>
                            {option}
                        </MenuItem>
                    ))}
                </TextField>

                <Stack spacing={1} alignItems='start'>
                    <TextField
                        label='Search Query'
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        fullWidth
                        error={!!errors.query}
                        helperText={errors.query}
                    />

                    <Stack>
                        <Typography variant='subtitle1' color='text.secondary'>
                            Users with any matching field are included in the results.
                        </Typography>
                        <FormControl error={!!errors.fields}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={allFields}
                                        onChange={(event) =>
                                            setAllFields(event.target.checked)
                                        }
                                    />
                                }
                                label='All Fields'
                            />
                            <Stack
                                direction='row'
                                sx={{ flexWrap: 'wrap', columnGap: 2.5 }}
                            >
                                {SearchFields.map((field) => {
                                    if (field === RatingSystem.Custom) {
                                        return null;
                                    }
                                    return (
                                        <FormControlLabel
                                            key={field}
                                            control={
                                                <Checkbox
                                                    checked={allFields || fields[field]}
                                                    onChange={(event) =>
                                                        onChangeField(
                                                            field,
                                                            event.target.checked
                                                        )
                                                    }
                                                />
                                            }
                                            disabled={allFields}
                                            label={getDisplayString(field)}
                                        />
                                    );
                                })}
                            </Stack>
                            <FormHelperText>{errors.fields}</FormHelperText>
                        </FormControl>
                    </Stack>

                    <LoadingButton
                        variant='contained'
                        onClick={onSearch}
                        loading={request.isLoading()}
                    >
                        Search
                    </LoadingButton>
                </Stack>

                {request.data && (
                    <DataGrid
                        autoHeight
                        columns={columns}
                        rows={request.data ?? []}
                        pageSizeOptions={[5, 10, 25]}
                        initialState={{
                            pagination: {
                                paginationModel: {
                                    page: 0,
                                    pageSize: 10,
                                },
                            },
                        }}
                        getRowId={(row) => row.username}
                    />
                )}
            </Stack>
        </Container>
    );
};

export default SearchPage;
