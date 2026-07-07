package com.sealo.domain.plan;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class PlanApiTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    private JsonNode createPlan(String title, List<String> items) throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "title", title,
                "theme", "TRAVEL",
                "icon", "✈️",
                "targetDate", "2026-08-15",
                "items", items
        ));
        String response = mockMvc.perform(post("/api/plans")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response);
    }

    @Test
    void 플랜을_생성하면_항목과_함께_저장된다() throws Exception {
        createPlan("제주 여행", List.of("여권", "충전기", "상비약"));

        mockMvc.perform(get("/api/plans"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("제주 여행"))
                .andExpect(jsonPath("$[0].totalItems").value(3))
                .andExpect(jsonPath("$[0].doneItems").value(0));
    }

    @Test
    void 전부_체크하면_완료_보너스를_1회만_받는다() throws Exception {
        JsonNode plan = createPlan("제주 여행", List.of("여권", "충전기"));
        long first = plan.get("items").get(0).get("id").asLong();
        long second = plan.get("items").get(1).get("id").asLong();

        mockMvc.perform(post("/api/plans/items/" + first + "/toggle"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bonusShells").value(0));

        mockMvc.perform(post("/api/plans/items/" + second + "/toggle"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bonusShells").value(30));

        // 해제 후 다시 체크해도 보너스 재지급 없음
        mockMvc.perform(post("/api/plans/items/" + second + "/toggle"))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/plans/items/" + second + "/toggle"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bonusShells").value(0));
    }

    @Test
    void 항목을_추가하고_삭제할_수_있다() throws Exception {
        JsonNode plan = createPlan("제주 여행", List.of("여권"));
        long planId = plan.get("id").asLong();

        String added = mockMvc.perform(post("/api/plans/" + planId + "/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("name", "선크림"))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long itemId = objectMapper.readTree(added).get("id").asLong();

        mockMvc.perform(delete("/api/plans/items/" + itemId))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/plans/" + planId))
                .andExpect(jsonPath("$.items.length()").value(1));
    }

    @Test
    void 다른_회원의_플랜은_조회할_수_없다() throws Exception {
        JsonNode plan = createPlan("제주 여행", List.of("여권"));
        long planId = plan.get("id").asLong();

        mockMvc.perform(get("/api/plans/" + planId).header("X-Member-Id", "999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void 플랜을_삭제하면_항목도_함께_사라진다() throws Exception {
        JsonNode plan = createPlan("제주 여행", List.of("여권", "충전기"));
        long planId = plan.get("id").asLong();

        mockMvc.perform(delete("/api/plans/" + planId))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/plans"))
                .andExpect(jsonPath("$.length()").value(0));
    }
}
