import useSyncState from "../hooks/useSyncState"
import { getTimelineData } from "../states/useTimelineData"
import LayerTreeItem from "./treeItems/LayerTreeItem"
import PropertyTreeItem from "./treeItems/PropertyTreeItem"

const TimelineGraph = () => {
    const [timelineData] = useSyncState(getTimelineData)

    return (
        <div className="lingo3d-absfull" style={{ overflow: "scroll" }}>
            {timelineData &&
                Object.entries(timelineData).map(([uuid, data]) => (
                    <LayerTreeItem key={uuid} uuid={uuid}>
                        {Object.keys(data).map((property) => (
                            <PropertyTreeItem
                                key={uuid + " " + property}
                                property={property}
                                uuid={uuid}
                            />
                        ))}
                    </LayerTreeItem>
                ))}
        </div>
    )
}

export default TimelineGraph
