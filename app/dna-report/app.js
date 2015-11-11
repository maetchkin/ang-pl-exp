var express = require('express'),
    dna = require('dna'),
    app = express();

app.get('*', function (req, res) {

    var length = req.query.length || 60,
        seq = dna.getRandomSeq(length);

    res.json(
        {
            "id": length + "n",
            "description": "Random sequence",
            "sequence": {
                "s5": seq,
                "s3": dna.complStrand(seq)
            }
        }
    );
})

app.listen(8100);

module.exports.app = app;