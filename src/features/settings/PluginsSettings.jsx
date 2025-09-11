import { FormList, Switch, Table } from "../../component/settings";

export default function PluginsSettings() {
    return (
        <>
            <h1>Plugin</h1>
            <section>
                <h3>Abbreviation</h3>
                <FormList>
                    <Switch
                        label="Match abbreviation case"
                        path="abbreviationPlugin.dynamicCasing"
                        description="Abbreviation keeps original text case."
                    />
                    <Switch
                        label="Match case on expand"
                        path="abbreviationPlugin.caseMatching"
                        description="Expanded text matches abbreviation case."
                    />
                    <Switch
                        label="Add space after abbreviation"
                        path="abbreviationPlugin.addSpace"
                        description="Automatically adds space after expanding."
                    />
                </FormList>
                <Table
                    headers={["Abbreviation", "Full form"]}
                    grid="30% auto"
                    path="abbreviationPlugin.abbreviations"
                />
            </section>
        </>
    );
}