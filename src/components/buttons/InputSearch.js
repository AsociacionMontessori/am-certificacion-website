import React, { useId, useMemo, useState } from "react";
import { navigate } from "gatsby";

export const InputSearch = ({ searchDataAutomcomplete = [], route = "", onSelect }) => {
    const listId = useId();
    const [query, setQuery] = useState("");

    const selectedRecord = useMemo(() => (
        searchDataAutomcomplete.find((record) => record.value === query)
    ), [query, searchDataAutomcomplete]);

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!selectedRecord) return;
        if (onSelect) {
            onSelect(selectedRecord.key, selectedRecord);
            return;
        }
        if (route) {
            navigate(`${route}${selectedRecord.key}`);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-5 grid grid-cols-1 gap-3 row-span-1 print:hidden">
            <label className="sr-only" htmlFor={`${listId}-input`}>Búsqueda</label>
            <div className="flex flex-col gap-2 sm:flex-row">
                <input
                    id={`${listId}-input`}
                    list={listId}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Búsqueda"
                    autoFocus
                    className="min-h-[48px] w-full rounded-lg border border-black bg-white px-4 py-2 text-black"
                />
                <datalist id={listId}>
                    {searchDataAutomcomplete.map((record) => (
                        <option key={record.key} value={record.value} />
                    ))}
                </datalist>
                <button
                    type="submit"
                    disabled={!selectedRecord}
                    className="min-h-[48px] rounded-lg bg-blue px-5 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Buscar
                </button>
            </div>
        </form>
    );
};

export default InputSearch;
