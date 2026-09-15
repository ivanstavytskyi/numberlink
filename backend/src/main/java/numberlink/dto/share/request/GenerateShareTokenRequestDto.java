package numberlink.dto.share.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GenerateShareTokenRequestDto {
    @NotBlank
    private String gameToken;
}