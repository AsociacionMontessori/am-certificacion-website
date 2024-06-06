import React from "react";
import ReactSearchBox from "react-search-box";
import { navigate } from 'gatsby';


export const InputSearch = ({ comment, searchDataAutomcomplete, route }) => {
    
    return (
        <>
            <div className="p-5 grid grid-cols-1 gap-4 row-span-1 print:hidden">
                <div style={{color: "black"}}>
                    
                    <ReactSearchBox
                        inputBoxFontColor="#000"
                        inputBoxBorderColor="#000"
                        dropdownBorderColor="#000"
                        
                        clearOnSelect={false}
                        fuseConfigs={{
                            // keys: ['nombre', 'apellido_paterno', 'apellido_materno'],
                            threshold: 0.05,
                            includeMatches: true,
                            minMatchCharLength: 0,
                            findAllMatches: true,

                        }}
                        data={searchDataAutomcomplete}
                        onSelect={(record) => {
                            // console.log("key:", record.item.key);
                            // router.push( route + record.item.key);
                            navigate(route + record.item.key);

                        }}
                        onFocus={() => {}}
                        onChange={(value) => console.log(value)}
                        placeholder="Búsqueda"
                        autoFocus
                        
                    />
                </div>
            </div>
        </>
    );
};

export default InputSearch;
