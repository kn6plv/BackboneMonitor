const Config = {

    backbones: [
        {
            name: "Bay Area Backbone",
            sites: [
                {
                    name: "ORCA",
                    root: {
                        name: "KJ6WEG-OAK-ORCA-hap.local.mesh"
                    },
                    nodes: [
                        { name: "KJ6WEG-OAK-ORCA-hap.local.mesh" },
                        { name: "KJ6WEG-OAK-ORCA-nsm5.local.mesh" },
                        { name: "KJ6WEG-OAK-ORCA-pbm5.local.mesh" },
                        { name: "KJ6WEG-OAK-ORCA-sectorti.local.mesh" }
                    ],
                    contacts: [
                        { name: "Tim Wilkinson", phone: "" }
                    ]
                },
                {
                    name: "Fish Ranch",
                    root: {
                        name: "KJ6WEG-OAK-FishRanch-SectorM5"
                    },
                    nodes: [
                        { name: "KJ6WEG-OAK-FishRanch-SectorM5" },
                        { name: "KJ6WEG-OAK-FishRanch-PBM5" }
                    ],
                    contacts: [
                        { name: "Tim Wilkinson", phone: "" }
                    ]
                }
            ]
        }
    ]

};

module.exports = Config;
