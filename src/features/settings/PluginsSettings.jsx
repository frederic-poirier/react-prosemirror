import { FormList, Switch, Table } from "../../component/settings";

export default function PluginsSettings() {
    return (
        <>
            <h1>Plugin</h1>
            <section>
                <h3>Abbreviation</h3>
                <FormList>
                    <Switch
                        label="Match abbreviation casing"
                        path="abbreviationPlugin.dynamicCasing"
                        description="Abbreviations will keep the same casing as the original text (e.g., ALL CAPS, lowercase, or mixed case)."
                    />
                    <Switch
                        label="Match case when expanding"
                        path="abbreviationPlugin.caseMatching"
                        description="Expanded text will match the case of the abbreviation."
                    />
                    <Switch
                        label="Insert space after abbreviation"
                        path="abbreviationPlugin.addSpace"
                        description="Automatically adds a space after the abbreviation when expanding."
                    />
                </FormList>
                <Table
                    headers={["Abrv", "Abbreviation"]}
                    grid="20% auto"
                    path="abbreviationPlugin.abbreviations"
                />
            </section>
        </>
    );
}