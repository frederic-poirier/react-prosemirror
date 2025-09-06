import { FormList, Switch, Table } from "../../../../component/settings";


export default function AbbreviationComponent() {
    return (
        <>
            <FormList>
                <Switch
                    label='Dynamic casing'
                    path='abbreviationPlugin.dynamicCasing'
                />

                <Switch
                    label='Prevent Trigger'
                    path='abbreviationPlugin.preventTrigger'
                />
            </FormList>
            <Table
                headers={['Abrv', 'Abbreviation']}
                path="abbreviationPlugin.abbreviations"
            />
        </>
    );
}