# Clear Review 

## Goal
Goal of the project is to analyse amazon reviews and there reviewers to get an more objectiv view of the review.
To achive that the the rating of an review is compared statisicaly to all over ratings of the same User.

### Next Steps 
* Complete Chain from Product link to JSON Metric Object 
* Speicherung der Daten in einem Key-Value storage 
* Abruf und annotation der gespeicherten Daten durch ein Chrome Plugin

## Object Architektur
In der Datenbank werden für jeden User folgende Statistiken gespeichert:
* Id (Hash von Amazon)
* Name des Reviewers
* Review by Metrics (stars,date,verified,vine)


